import { prisma } from "@/lib/db";
import { DEPOSIT_PERCENTAGE } from "@/lib/consts";
import {
  coerceCustomSelections,
  coerceProductCustomFields,
  type ProductCustomSelections,
} from "@/lib/types";
import {
  calculateContributionPlan,
  clampContributionDuration,
  type ContributionCadence,
} from "@/lib/utils";

export const orderService = {
  /**
   * Create a new order with price lock
   */
  async create(data: {
    userId: string;
    productId: string;
    quantity: number;
    addressId?: string;
    addressLabel?: string;
    deliveryMethod?: "DELIVERY" | "PICKUP";
    pickupLocationId?: string;
    recipientName?: string;
    phone?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    purchaseMode?: "buy-now" | "contribute";
    installmentMonths?: number;
    contributionCadence?: ContributionCadence;
    contributionDuration?: number;
    selectedColor?: string;
    selectedSize?: string;
    customSelections?: ProductCustomSelections;
    logisticsProvider?: "INTERNAL" | "SPEEDAF";
    /** Standard delivery fee in kobo (0 for pickup or free delivery) */
    deliveryFeeKobo?: number;
  }) {
    const product = await prisma.product.findUnique({
      where: { id: data.productId },
    });

    if (!product || product.status !== "AVAILABLE") {
      throw new Error("Product is not available");
    }

    if (product.colors.length > 0 && !data.selectedColor) {
      throw new Error("Please choose a color");
    }

    if (data.selectedColor && !product.colors.includes(data.selectedColor)) {
      throw new Error("Selected color is not available for this product");
    }

    if (product.sizes.length > 0 && !data.selectedSize) {
      throw new Error("Please choose a size");
    }

    if (data.selectedSize && !product.sizes.includes(data.selectedSize)) {
      throw new Error("Selected size is not available for this product");
    }

    const customFields = coerceProductCustomFields(product.customFields);
    const customSelections = data.customSelections ?? {};
    const normalizedSelections: ProductCustomSelections = {};
    const deliveryMethod = data.deliveryMethod ?? "DELIVERY";

    for (const field of customFields) {
      const value = customSelections[field.id];

      if (field.required && !value) {
        throw new Error(`${field.label} is required`);
      }

      if (!value) continue;

      if (field.type === "select") {
        const allowed = new Set(field.options.map((option) => option.value));
        if (!allowed.has(value)) {
          throw new Error(`Invalid selection for ${field.label}`);
        }
      }

      normalizedSelections[field.label] = value;
    }

    let addressId = data.addressId;
    let pickupLocationId: string | undefined;
    let logisticsProvider: "INTERNAL" | "SPEEDAF" =
      data.logisticsProvider ?? "INTERNAL";

    if (deliveryMethod === "DELIVERY") {
      if (addressId) {
        const savedAddress = await prisma.deliveryAddress.findFirst({
          where: { id: addressId, userId: data.userId },
        });

        if (!savedAddress) {
          throw new Error("Selected delivery address was not found");
        }
      } else {
        const recipientName = data.recipientName?.trim();
        const phone = data.phone?.trim();
        const addressLine1 = data.addressLine1?.trim();
        const city = data.city?.trim();
        const state = data.state?.trim();

        if (!recipientName || !phone || !addressLine1 || !city || !state) {
          throw new Error("Delivery address is required for doorstep delivery");
        }

        const savedAddress = await prisma.deliveryAddress.create({
          data: {
            userId: data.userId,
            label: data.addressLabel?.trim() || "Home",
            recipientName,
            phone,
            addressLine1,
            addressLine2: data.addressLine2?.trim() || undefined,
            city,
            state,
          },
        });

        addressId = savedAddress.id;
      }
    } else {
      if (!data.pickupLocationId) {
        throw new Error("Please choose a pickup location");
      }

      const pickupLocation = await prisma.pickupLocation.findFirst({
        where: { id: data.pickupLocationId, isActive: true },
      });

      if (!pickupLocation) {
        throw new Error("Selected pickup location is not available");
      }

      pickupLocationId = pickupLocation.id;
      logisticsProvider = pickupLocation.logisticsProvider;
    }

    const purchaseMode = data.purchaseMode ?? "contribute";
    const baseTotal = product.markupPrice * data.quantity;
    // Delivery fee only applies to door delivery; pickup is always free
    const deliveryFeeKobo =
      deliveryMethod === "DELIVERY" ? (data.deliveryFeeKobo ?? 0) : 0;
    let totalAmount = baseTotal + deliveryFeeKobo;
    let installmentMonths =
      purchaseMode === "buy-now" ? 1 : Math.min(data.installmentMonths ?? 3, 3);

    if (purchaseMode === "contribute") {
      const cadence = data.contributionCadence ?? "monthly";
      const duration = clampContributionDuration(
        cadence,
        data.contributionDuration ?? installmentMonths,
      );
      const plan = calculateContributionPlan({
        totalPrice: baseTotal,
        cadence,
        duration,
      });

      totalAmount = plan.adjustedTotal + deliveryFeeKobo;
      installmentMonths = plan.installmentMonths;
      normalizedSelections["Payment plan"] =
        `${cadence} over ${plan.durationLabel}`;
    }

    normalizedSelections["Fulfillment"] =
      deliveryMethod === "PICKUP" ? "Pickup" : "Door delivery";

    const priceLockExpiresAt = new Date();
    priceLockExpiresAt.setDate(
      priceLockExpiresAt.getDate() + product.priceLockDays,
    );

    return prisma.order.create({
      data: {
        userId: data.userId,
        productId: data.productId,
        deliveryMethod,
        quantity: data.quantity,
        addressId,
        pickupLocationId,
        logisticsProvider,
        selectedColor: data.selectedColor,
        selectedSize: data.selectedSize,
        customSelections: coerceCustomSelections(normalizedSelections),
        deliveryFeeKobo,
        totalAmount,
        installmentMonths,
        priceLockExpiresAt,
      },
      include: { product: true },
    });
  },

  /**
   * Process a successful payment — atomic update with optimistic locking
   */
  async processPayment(orderId: string, amountKobo: number) {
    return prisma.$transaction(async (tx) => {
      // Lock the order row for update
      const order = await tx.order.findUniqueOrThrow({
        where: { id: orderId },
      });

      if (
        order.status === "PAID" ||
        order.status === "CANCELLED" ||
        order.status === "EXPIRED"
      ) {
        throw new Error(
          `Order ${orderId} is in terminal state: ${order.status}`,
        );
      }

      const newAmountPaid = order.amountPaid + amountKobo;
      const depositThreshold = Math.round(
        order.totalAmount * DEPOSIT_PERCENTAGE,
      );
      const isNowDepositPaid = newAmountPaid >= depositThreshold;
      const isFullyPaid = newAmountPaid >= order.totalAmount;

      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          amountPaid: newAmountPaid,
          isDepositPaid: isNowDepositPaid || order.isDepositPaid,
          status: isFullyPaid ? "PAID" : "PARTIAL",
          completedAt: isFullyPaid ? new Date() : null,
        },
      });

      return {
        order: updatedOrder,
        isDepositJustPaid: !order.isDepositPaid && isNowDepositPaid,
        isFullyPaid,
      };
    });
  },

  /**
   * Get orders for a user
   */
  async getByUser(userId: string) {
    return prisma.order.findMany({
      where: { userId },
      include: { product: true, deliveryAddress: true, pickupLocation: true },
      orderBy: { createdAt: "desc" },
    });
  },

  /**
   * Get a single order with full details
   */
  async getById(orderId: string) {
    return prisma.order.findUnique({
      where: { id: orderId },
      include: {
        product: true,
        transactions: { orderBy: { createdAt: "desc" } },
        deliveryAddress: true,
        pickupLocation: true,
        helpMePay: { select: { slug: true, isActive: true } },
      },
    });
  },

  /**
   * Get orders ready for procurement (fully paid)
   */
  async getReadyForProcurement() {
    return prisma.order.findMany({
      where: { status: "PAID" },
      include: {
        product: true,
        user: true,
        deliveryAddress: true,
        pickupLocation: true,
      },
      orderBy: { completedAt: "asc" },
    });
  },

  /**
   * Get orders with expired price locks (past 60 days, not fully paid)
   */
  async getExpiredPriceLocks() {
    return prisma.order.findMany({
      where: {
        priceLockExpiresAt: { lt: new Date() },
        status: { in: ["PENDING", "PARTIAL"] },
        priceLocked: true,
      },
      include: { product: true, user: true },
    });
  },

  /**
   * Mark expired orders
   */
  async markExpired(orderIds: string[]) {
    return prisma.order.updateMany({
      where: { id: { in: orderIds } },
      data: { status: "EXPIRED", priceLocked: false },
    });
  },

  /**
   * Admin: Update order status (procured, dispatched, delivered)
   */
  async updateStatus(
    orderId: string,
    data: {
      status: string;
      riderName?: string;
      riderPhone?: string;
      trackingNote?: string;
      adminUserId: string;
    },
  ) {
    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: data.status as "PROCURED" | "DISPATCHED" | "DELIVERED",
        riderName: data.riderName,
        riderPhone: data.riderPhone,
        trackingNote: data.trackingNote,
        procuredAt: data.status === "PROCURED" ? new Date() : undefined,
        deliveredAt: data.status === "DELIVERED" ? new Date() : undefined,
      },
    });

    // Audit trail
    await prisma.adminAction.create({
      data: {
        adminUserId: data.adminUserId,
        action: `MARK_${data.status}`,
        targetType: "Order",
        targetId: orderId,
        metadata: { riderName: data.riderName, riderPhone: data.riderPhone },
      },
    });

    return order;
  },
};
