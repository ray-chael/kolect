"use server";

import { requireSession } from "@/lib/session";
import { orderService } from "@/lib/services/order.service";
import { paymentService } from "@/lib/services/payment.service";
import { createOrderSchema, initiatePaymentSchema } from "@/lib/schemas";
import type { ActionResult } from "@/lib/types";
import { MIN_INSTALLMENT_KOBO } from "@/lib/consts";

function parseSelectionMap(value: FormDataEntryValue | null): Record<string, string> {
  if (typeof value !== "string" || value.trim() === "") return {};

  try {
    return JSON.parse(value) as Record<string, string>;
  } catch {
    return {};
  }
}

/**
 * Create a new "Contribute to Buy" order
 */
export async function createOrder(
  formData: FormData
): Promise<ActionResult> {
  try {
    const session = await requireSession();

    const rawData = {
      productId: formData.get("productId") as string,
      quantity: Number(formData.get("quantity") || 1),
      addressId: (formData.get("addressId") as string) || undefined,
      deliveryMethod: (formData.get("deliveryMethod") as string) || "DELIVERY",
      pickupLocationId: (formData.get("pickupLocationId") as string) || undefined,
      recipientName: (formData.get("recipientName") as string) || undefined,
      phone: (formData.get("phone") as string) || undefined,
      addressLine1: (formData.get("addressLine1") as string) || undefined,
      addressLine2: (formData.get("addressLine2") as string) || undefined,
      city: (formData.get("city") as string) || undefined,
      state: (formData.get("state") as string) || undefined,
      purchaseMode: (formData.get("purchaseMode") as string) || "contribute",
      installmentMonths: Number(formData.get("installmentMonths") || 3),
      contributionCadence: (formData.get("contributionCadence") as string) || undefined,
      contributionDuration: Number(formData.get("contributionDuration") || 0) || undefined,
      selectedColor: (formData.get("selectedColor") as string) || undefined,
      selectedSize: (formData.get("selectedSize") as string) || undefined,
      customSelections: parseSelectionMap(formData.get("customSelections")),
    };

    const parsed = createOrderSchema.safeParse(rawData);
    if (!parsed.success) {
      return {
        success: false,
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const order = await orderService.create({
      userId: session.user.id,
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
      message: error instanceof Error ? error.message : "Failed to create order",
    };
  }
}

/**
 * Initiate a payment (installment) for an order
 */
export async function initiatePayment(
  formData: FormData
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

    if (order.status === "PAID" || order.status === "CANCELLED" || order.status === "EXPIRED") {
      return { success: false, message: `Order is ${order.status.toLowerCase()}` };
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
      message: error instanceof Error ? error.message : "Failed to initiate payment",
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
