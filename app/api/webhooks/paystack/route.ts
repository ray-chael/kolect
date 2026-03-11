import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { paymentService } from "@/lib/services/payment.service";
import { orderService } from "@/lib/services/order.service";
import { notificationService } from "@/lib/services/notification.service";
import type { PaystackWebhookEvent } from "@/lib/types";
import { formatNaira } from "@/lib/types";

/**
 * Verify Paystack webhook signature using HMAC SHA-512
 */
function verifyPaystackSignature(
  body: string,
  signature: string
): boolean {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return false;

  const hash = crypto
    .createHmac("sha512", secret)
    .update(body)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(hash, "hex"),
    Buffer.from(signature, "hex")
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-paystack-signature");

    // Validate signature
    if (!signature || !verifyPaystackSignature(body, signature)) {
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    const event: PaystackWebhookEvent = JSON.parse(body);

    // Only process successful charges
    if (event.event !== "charge.success") {
      return NextResponse.json({ received: true });
    }

    const reference = event.data.reference;
    const amountKobo = event.data.amount;

    // Step 1: Process the webhook (idempotent)
    const result = await paymentService.processWebhook(
      reference,
      event.data as unknown as Record<string, unknown>
    );

    if (!result || result.alreadyProcessed) {
      return NextResponse.json({ received: true });
    }

    // Step 2: Update order balance (atomic)
    const { transaction } = result;
    const paymentResult = await orderService.processPayment(
      transaction.orderId,
      amountKobo
    );

    // Step 3: Queue notifications
    if (paymentResult.isDepositJustPaid) {
      await notificationService.queue({
        userId: transaction.userId,
        orderId: transaction.orderId,
        channel: "WHATSAPP",
        type: "DEPOSIT_CONFIRMED",
        message: `Your deposit of ${formatNaira(amountKobo)} has been confirmed. Your price is now locked!`,
      });
    }

    if (paymentResult.isFullyPaid) {
      await notificationService.queue({
        userId: transaction.userId,
        orderId: transaction.orderId,
        channel: "WHATSAPP",
        type: "ORDER_FULLY_PAID",
        message: `Your order is fully paid (${formatNaira(paymentResult.order.totalAmount)}). We'll begin procurement soon!`,
      });
    } else {
      await notificationService.queue({
        userId: transaction.userId,
        orderId: transaction.orderId,
        channel: "WHATSAPP",
        type: "PAYMENT_RECEIVED",
        message: `Payment of ${formatNaira(amountKobo)} received. Balance remaining: ${formatNaira(paymentResult.order.totalAmount - paymentResult.order.amountPaid)}.`,
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    // Return 200 to prevent Paystack from retrying for application errors
    // (only return non-200 for actual infrastructure failures)
    return NextResponse.json({ received: true });
  }
}
