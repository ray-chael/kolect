"use server";

import { requireSession } from "@/lib/session";
import { orderService } from "@/lib/services/order.service";
import { paymentService } from "@/lib/services/payment.service";
import { createOrderSchema, initiatePaymentSchema } from "@/lib/schemas";
import type { ActionResult } from "@/lib/types";
import { MIN_INSTALLMENT_KOBO } from "@/lib/consts";
import { prisma } from "@/lib/db";
import { getSettingValue } from "@/actions/settings";
import {
    computeDeliveryFeeKobo,
    parseDeliveryRates,
} from "@/lib/utils/delivery-rates";
import { notificationService } from "@/lib/services/notification.service";

function parseSelectionMap(
  value: FormDataEntryValue | null,
): Record<string, string> {
  if (typeof value !== "string" || value.trim() === "") return {};

  try {
    return JSON.parse(value) as Record<string, string>;
  } catch {
    return {};
  }
}

/**
 * Create a new "Pay Small Small" order
 */
export async function createOrder(formData: FormData): Promise<ActionResult> {
  try {
    const session = await requireSession();

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { hasAcceptedTerms: true },
    });
    const alreadyAccepted = user?.hasAcceptedTerms ?? false;
    const termsAcceptedNow = formData.get("termsAccepted") === "true";

    if (!alreadyAccepted && !termsAcceptedNow) {
      return {
        success: false,
        message:
          "You must agree to the terms and conditions before continuing.",
        errors: { termsAccepted: ["Required"] },
      };
    }

    const rawData = {
      productId: formData.get("productId") as string,
      quantity: Number(formData.get("quantity") || 1),
      // If already accepted in DB, treat terms as satisfied regardless of form input
      termsAccepted: alreadyAccepted || termsAcceptedNow,
      addressId: (formData.get("addressId") as string) || undefined,
      addressLabel: (formData.get("addressLabel") as string) || undefined,
      deliveryMethod: (formData.get("deliveryMethod") as string) || "DELIVERY",
      pickupLocationId:
        (formData.get("pickupLocationId") as string) || undefined,
      recipientName: (formData.get("recipientName") as string) || undefined,
      phone: (formData.get("phone") as string) || undefined,
      addressLine1: (formData.get("addressLine1") as string) || undefined,
      addressLine2: (formData.get("addressLine2") as string) || undefined,
      city: (formData.get("city") as string) || undefined,
      state: (formData.get("state") as string) || undefined,
      purchaseMode: (formData.get("purchaseMode") as string) || "contribute",
      installmentMonths: Number(formData.get("installmentMonths") || 3),
      contributionCadence:
        (formData.get("contributionCadence") as string) || undefined,
      contributionDuration:
        Number(formData.get("contributionDuration") || 0) || undefined,
      selectedColor: (formData.get("selectedColor") as string) || undefined,
      selectedSize: (formData.get("selectedSize") as string) || undefined,
      customSelections: parseSelectionMap(formData.get("customSelections")),
      logisticsProvider:
        (formData.get("logisticsProvider") as string) || "INTERNAL",
    };

    const parsed = createOrderSchema.safeParse(rawData);
    if (!parsed.success) {
      return {
        success: false,
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    // Persist acceptance on first agreement
    if (!alreadyAccepted && termsAcceptedNow) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { hasAcceptedTerms: true, termsAcceptedAt: new Date() },
      });
    }

    // Resolve delivery fee: standard fee only applies to door delivery, not pickup
    const deliveryMethod = parsed.data.deliveryMethod ?? "DELIVERY";
    let deliveryFeeKobo = 0;
    if (deliveryMethod === "DELIVERY") {
      // Resolve the destination state + city/LGA for fee computation
      let addrState = parsed.data.state ?? "";
      let addrCity = parsed.data.city ?? "";
      if (parsed.data.addressId) {
        const addr = await prisma.deliveryAddress.findUnique({
          where: { id: parsed.data.addressId },
          select: { state: true, city: true },
        });
        addrState = addr?.state ?? "";
        addrCity = addr?.city ?? "";
      }

      const [defaultFeeRaw, lagosRatesRaw, stateRatesRaw] = await Promise.all([
        getSettingValue("defaultDeliveryFee"),
        getSettingValue("lagosLgaRates"),
        getSettingValue("stateDeliveryRates"),
      ]);
      const rates = parseDeliveryRates(
        lagosRatesRaw || "{}",
        stateRatesRaw || "{}",
        Number(defaultFeeRaw) || 0,
      );
      deliveryFeeKobo = addrState
        ? computeDeliveryFeeKobo(addrState, addrCity, rates)
        : 0;
    }

    const order = await orderService.create({
      userId: session.user.id,
      deliveryFeeKobo,
      ...parsed.data,
    });

    return {
      success: true,
      message: "Order created. Make your first payment to lock the price!",
      data: { orderId: order.id },
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to create order",
    };
  }
}

/**
 * Initiate a payment (installment) for an order
 */
export async function initiatePayment(
  formData: FormData,
): Promise<ActionResult<{ authorizationUrl: string; reference: string }>> {
  try {
    const session = await requireSession();

    const rawData = {
      orderId: formData.get("orderId") as string,
      amount: Number(formData.get("amount")),
    };

    const parsed = initiatePaymentSchema.safeParse(rawData);
    if (!parsed.success) {
      return {
        success: false,
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    // Validate the order belongs to the user
    const order = await orderService.getById(parsed.data.orderId);
    if (!order || order.userId !== session.user.id) {
      return { success: false, message: "Order not found" };
    }

    if (
      order.status === "PAID" ||
      order.status === "CANCELLED" ||
      order.status === "EXPIRED"
    ) {
      return {
        success: false,
        message: `Order is ${order.status.toLowerCase()}`,
      };
    }

    // Cap payment at remaining balance
    const remaining = order.totalAmount - order.amountPaid;
    const amountKobo = Math.min(parsed.data.amount, remaining);

    if (amountKobo < MIN_INSTALLMENT_KOBO && amountKobo < remaining) {
      return {
        success: false,
        message: "Minimum payment is ₦2,000 (unless paying remaining balance)",
      };
    }

    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/orders/${order.id}/payment-callback`;

    const payment = await paymentService.initializePayment({
      email: session.user.email,
      amountKobo,
      orderId: order.id,
      userId: session.user.id,
      callbackUrl,
    });

    return {
      success: true,
      message: "Payment initialized",
      data: {
        authorizationUrl: payment.authorizationUrl,
        reference: payment.reference,
      },
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to initiate payment",
    };
  }
}

/**
 * Notify admin that the user has manually sent a bank transfer.
 * Creates a PaymentProof record so the admin can confirm.
 */
export async function notifyTransferSent(
  orderId: string,
): Promise<ActionResult> {
  try {
    const session = await requireSession();

    const order = await orderService.getById(orderId);
    if (!order || order.userId !== session.user.id) {
      return { success: false, message: "Order not found" };
    }

    if (["PAID", "CANCELLED", "EXPIRED"].includes(order.status)) {
      return {
        success: false,
        message: `Order is already ${order.status.toLowerCase()}`,
      };
    }

    // Prevent duplicate notifications for the same order
    const syntheticId = `manual_${orderId}`;
    const existing = await prisma.paymentProof.findUnique({
      where: { resendEmailId: syntheticId },
    });
    if (existing) {
      return { success: true, message: "Already notified" };
    }

    await prisma.paymentProof.create({
      data: {
        orderId,
        fromEmail: session.user.email,
        subject: `Manual transfer notification for order ${orderId}`,
        resendEmailId: syntheticId,
        attachmentUrls: [],
        rawAttachments: [],
      },
    });

    // Notify admin
    const admin = await prisma.user.findFirst({ where: { role: "CRIMSON" } });
    if (admin) {
      notificationService
        .queue({
          userId: admin.id,
          orderId,
          channel: "EMAIL",
          type: "PAYMENT_PROOF_SUBMITTED",
          message: `${session.user.name ?? session.user.email} says they've sent a bank transfer for order #${orderId.slice(-8).toUpperCase()}.`,
        })
        .catch(console.error);
    }

    return { success: true, message: "Admin notified" };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to notify",
    };
  }
}

/**
 * Get all orders for the current user
 */
export async function getUserOrders(): Promise<ActionResult> {
  try {
    const session = await requireSession();
    const orders = await orderService.getByUser(session.user.id);
    return { success: true, message: "Orders retrieved", data: orders };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to fetch orders",
    };
  }
}

/**
 * Get a single order with transaction history
 */
export async function getOrderDetails(
  orderId: string
): Promise<ActionResult> {
  try {
    const session = await requireSession();
    const order = await orderService.getById(orderId);

    if (!order || order.userId !== session.user.id) {
      return { success: false, message: "Order not found" };
    }

    return { success: true, message: "Order retrieved", data: order };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to fetch order",
    };
  }
}

/**
 * Select delivery method for orders created via group-buy / help-me-pay
 * that were auto-created without delivery details.
 */
export async function selectDeliveryMethod(
  formData: FormData,
): Promise<ActionResult> {
  try {
    const session = await requireSession();

    const orderId = formData.get("orderId") as string;
    const deliveryMethod = formData.get("deliveryMethod") as string;

    if (!orderId) return { success: false, message: "Order is required" };
    if (!deliveryMethod || !["DELIVERY", "PICKUP"].includes(deliveryMethod)) {
      return { success: false, message: "Invalid delivery method" };
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { groupBuy: true, helpMePay: true },
    });

    if (!order || order.userId !== session.user.id) {
      return { success: false, message: "Order not found" };
    }

    // Only allow if order has no delivery details set yet
    if (order.addressId || order.pickupLocationId) {
      return { success: false, message: "Delivery method already selected" };
    }

    if (deliveryMethod === "PICKUP") {
      const pickupLocationId = formData.get("pickupLocationId") as string;
      if (!pickupLocationId) {
        return { success: false, message: "Pickup location is required" };
      }

      const location = await prisma.pickupLocation.findUnique({
        where: { id: pickupLocationId, isActive: true },
      });
      if (!location) {
        return { success: false, message: "Pickup location not found" };
      }

      await prisma.order.update({
        where: { id: orderId },
        data: {
          deliveryMethod: "PICKUP",
          pickupLocationId,
          deliveryFeeKobo: 0,
        },
      });
    } else {
      // DELIVERY
      const addressId = (formData.get("addressId") as string) || undefined;

      let finalAddressId = addressId;

      if (!addressId || addressId === "new") {
        // Create new address
        const recipientName = (formData.get("recipientName") as string)?.trim();
        const phone = (formData.get("phone") as string)?.trim();
        const addressLine1 = (formData.get("addressLine1") as string)?.trim();
        const addressLine2 = (formData.get("addressLine2") as string)?.trim() || null;
        const city = (formData.get("city") as string)?.trim();
        const state = (formData.get("state") as string)?.trim();
        const addressLabel = (formData.get("addressLabel") as string)?.trim() || "Default";

        if (!recipientName || !phone || !addressLine1 || !city || !state) {
          return { success: false, message: "All address fields are required" };
        }

        const address = await prisma.deliveryAddress.create({
          data: {
            userId: session.user.id,
            label: addressLabel,
            recipientName,
            phone,
            addressLine1,
            addressLine2,
            city,
            state,
          },
        });
        finalAddressId = address.id;
      } else {
        // Verify the address belongs to the user
        const address = await prisma.deliveryAddress.findUnique({
          where: { id: addressId },
        });
        if (!address || address.userId !== session.user.id) {
          return { success: false, message: "Address not found" };
        }
      }

      // Compute delivery fee
      const addr = await prisma.deliveryAddress.findUnique({
        where: { id: finalAddressId },
        select: { state: true, city: true },
      });
      const [defaultFeeRaw, lagosRatesRaw, stateRatesRaw] = await Promise.all([
        getSettingValue("defaultDeliveryFee"),
        getSettingValue("lagosLgaRates"),
        getSettingValue("stateDeliveryRates"),
      ]);
      const rates = parseDeliveryRates(
        lagosRatesRaw || "{}",
        stateRatesRaw || "{}",
        Number(defaultFeeRaw) || 0,
      );
      const deliveryFeeKobo = addr?.state
        ? computeDeliveryFeeKobo(addr.state, addr.city, rates)
        : 0;

      await prisma.order.update({
        where: { id: orderId },
        data: {
          deliveryMethod: "DELIVERY",
          addressId: finalAddressId,
          deliveryFeeKobo,
          totalAmount: { increment: deliveryFeeKobo },
        },
      });
    }

    return { success: true, message: "Delivery method saved" };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to save delivery method",
    };
  }
}

/**
 * Shopper confirms receipt of a delivered order
 */
export async function confirmReceipt(
  orderId: string,
): Promise<ActionResult> {
  try {
    const session = await requireSession();

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order || order.userId !== session.user.id) {
      return { success: false, message: "Order not found" };
    }

    if (order.status !== "DELIVERED") {
      return { success: false, message: "Order has not been delivered yet" };
    }

    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "RECEIVED",
        receivedAt: new Date(),
      },
    });

    return { success: true, message: "Receipt confirmed! Thank you." };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to confirm receipt",
    };
  }
}
