import { prisma } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import type {
  PaystackInitResponse,
  PaystackVerifyResponse,
} from "@/lib/types";
import { PAYSTACK_ENDPOINTS } from "@/lib/consts";

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY!;

async function paystackFetch<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Paystack API error (${res.status}): ${body}`);
  }

  return res.json() as Promise<T>;
}

export const paymentService = {
  /**
   * Initialize a Paystack transaction
   */
  async initializePayment(data: {
    email: string;
    amountKobo: number;
    orderId: string;
    userId: string;
    callbackUrl: string;
  }) {
    const idempotencyKey = uuidv4();
    const reference = `kolekt_${data.orderId}_${Date.now()}_${idempotencyKey.slice(0, 8)}`;

    // Create pending transaction BEFORE calling Paystack
    await prisma.transaction.create({
      data: {
        orderId: data.orderId,
        userId: data.userId,
        amount: data.amountKobo,
        type: "INSTALLMENT", // Will be updated to DEPOSIT if first payment
        paystackRef: reference,
        idempotencyKey,
        status: "PENDING",
      },
    });

    const response = await paystackFetch<PaystackInitResponse>(
      PAYSTACK_ENDPOINTS.INITIALIZE,
      {
        method: "POST",
        body: JSON.stringify({
          email: data.email,
          amount: data.amountKobo,
          reference,
          callback_url: data.callbackUrl,
          metadata: {
            order_id: data.orderId,
            user_id: data.userId,
            idempotency_key: idempotencyKey,
          },
        }),
      }
    );

    return {
      authorizationUrl: response.data.authorization_url,
      reference: response.data.reference,
      accessCode: response.data.access_code,
    };
  },

  /**
   * Verify a transaction with Paystack
   */
  async verifyPayment(reference: string) {
    return paystackFetch<PaystackVerifyResponse>(
      PAYSTACK_ENDPOINTS.VERIFY(reference)
    );
  },

  /**
   * Process a successful webhook — idempotent
   */
  async processWebhook(reference: string, paystackData: Record<string, unknown>) {
    // Find the pending transaction by reference
    const transaction = await prisma.transaction.findUnique({
      where: { paystackRef: reference },
    });

    if (!transaction) {
      // Orphaned webhook — no matching pending transaction
      console.warn(`Webhook received for unknown reference: ${reference}`);
      return null;
    }

    // Idempotency check: already processed
    if (transaction.status === "SUCCESS") {
      return { alreadyProcessed: true, transaction };
    }

    // Mark transaction as successful
    const updatedTransaction = await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        status: "SUCCESS",
        paystackResponse: paystackData,
      },
    });

    return { alreadyProcessed: false, transaction: updatedTransaction };
  },

  /**
   * Get transactions for an order
   */
  async getByOrder(orderId: string) {
    return prisma.transaction.findMany({
      where: { orderId, status: "SUCCESS" },
      orderBy: { createdAt: "desc" },
    });
  },
};
