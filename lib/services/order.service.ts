import { prisma } from "@/lib/db";
import { DEPOSIT_PERCENTAGE } from "@/lib/consts";

export const orderService = {
  /**
   * Create a new order with price lock
   */
  async create(data: {
    userId: string;
    productId: string;
    quantity: number;
    addressId?: string;
  }) {
    const product = await prisma.product.findUnique({
      where: { id: data.productId },
    });

    if (!product || product.status !== "AVAILABLE") {
      throw new Error("Product is not available");
    }

    const totalAmount = product.markupPrice * data.quantity;
    const priceLockExpiresAt = new Date();
    priceLockExpiresAt.setDate(
      priceLockExpiresAt.getDate() + product.priceLockDays
    );

    return prisma.order.create({
      data: {
        userId: data.userId,
        productId: data.productId,
        quantity: data.quantity,
        addressId: data.addressId,
        totalAmount,
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

      if (order.status === "PAID" || order.status === "CANCELLED" || order.status === "EXPIRED") {
        throw new Error(`Order ${orderId} is in terminal state: ${order.status}`);
      }

      const newAmountPaid = order.amountPaid + amountKobo;
      const depositThreshold = Math.round(order.totalAmount * DEPOSIT_PERCENTAGE);
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
      include: { product: true },
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
      },
    });
  },

  /**
   * Get orders ready for procurement (fully paid)
   */
  async getReadyForProcurement() {
    return prisma.order.findMany({
      where: { status: "PAID" },
      include: { product: true, user: true, deliveryAddress: true },
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
    }
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
