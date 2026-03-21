import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { paymentService } from "@/lib/services/payment.service";
import { orderService } from "@/lib/services/order.service";
import { notificationService } from "@/lib/services/notification.service";
import { emailService } from "@/lib/services/email.service";
import type { PaystackWebhookEvent } from "@/lib/types";
import { formatNaira } from "@/lib/types";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import React from "react";
import { GroupBuyOwnershipEmail } from "@/emails/group-buy-ownership";
import { HelpMePayFundedEmail } from "@/emails/help-me-pay-funded";
import { HelpMePayContributionReceiptEmail } from "@/emails/help-me-pay-contribution-receipt";

/**
 * Verify Paystack webhook signature using HMAC SHA-512
 */
function verifyPaystackSignature(body: string, signature: string): boolean {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return false;

  const hash = crypto.createHmac("sha512", secret).update(body).digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(hash, "hex"),
    Buffer.from(signature, "hex"),
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-paystack-signature");

    // Validate signature
    if (!signature || !verifyPaystackSignature(body, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event: PaystackWebhookEvent = JSON.parse(body);

    // Persist raw webhook payload (fire-and-forget)
    prisma.webhookLog
      .create({
        data: {
          source: "paystack",
          event: event.event,
          reference: (event.data as Record<string, unknown>)?.reference as
            | string
            | undefined,
          rawBody: body,
          payload: JSON.parse(body),
        },
      })
      .catch(console.error);

    // Only process successful charges
    if (event.event !== "charge.success") {
      return NextResponse.json({ received: true });
    }

    const reference = event.data.reference;
    const amountKobo = event.data.amount;

    // ─── Try regular order transaction first ────────────────────
    const result = await paymentService.processWebhook(
      reference,
      event.data as unknown as Record<string, unknown>,
    );

    if (result) {
      if (result.alreadyProcessed) {
        return NextResponse.json({ received: true });
      }

      // Update order balance (atomic)
      const { transaction } = result;
      const paymentResult = await orderService.processPayment(
        transaction.orderId,
        amountKobo,
      );

      // Queue notifications
      if (paymentResult.isDepositJustPaid) {
        await notificationService.queue({
          userId: transaction.userId,
          orderId: transaction.orderId,
          channel: "WHATSAPP",
          type: "DEPOSIT_CONFIRMED",
          message: `Your deposit of ${formatNaira(amountKobo)} has been confirmed. Your price is now locked!`,
        });
        emailService
          .send("DEPOSIT_CONFIRMED", transaction.userId, transaction.orderId, {
            amountKobo,
          })
          .catch(console.error);
      }

      if (paymentResult.isFullyPaid) {
        await notificationService.queue({
          userId: transaction.userId,
          orderId: transaction.orderId,
          channel: "WHATSAPP",
          type: "ORDER_FULLY_PAID",
          message: `Your order is fully paid (${formatNaira(paymentResult.order.totalAmount)}). We'll begin procurement soon!`,
        });
        emailService
          .send("ORDER_FULLY_PAID", transaction.userId, transaction.orderId)
          .catch(console.error);
      } else {
        await notificationService.queue({
          userId: transaction.userId,
          orderId: transaction.orderId,
          channel: "WHATSAPP",
          type: "PAYMENT_RECEIVED",
          message: `Payment of ${formatNaira(amountKobo)} received. Balance remaining: ${formatNaira(paymentResult.order.totalAmount - paymentResult.order.amountPaid)}.`,
        });
        emailService
          .send("PAYMENT_RECEIVED", transaction.userId, transaction.orderId, {
            amountKobo,
          })
          .catch(console.error);
      }

      return NextResponse.json({ received: true });
    }

    // ─── Try Group Buy contribution ─────────────────────────────
    const gbContribution = await prisma.groupBuyContribution.findUnique({
      where: { paystackRef: reference },
    });

    if (gbContribution) {
      if (gbContribution.status === "SUCCESS") {
        return NextResponse.json({ received: true });
      }

      await processGroupBuyContribution(
        gbContribution.id,
        amountKobo,
        event.data as unknown as Record<string, unknown>,
      );
      return NextResponse.json({ received: true });
    }

    // ─── Try Help Me Pay contribution ───────────────────────────
    const hmpContribution = await prisma.helpMePayContribution.findUnique({
      where: { paystackRef: reference },
    });

    if (hmpContribution) {
      if (hmpContribution.status === "SUCCESS") {
        return NextResponse.json({ received: true });
      }

      await processHelpMePayContribution(
        hmpContribution.id,
        amountKobo,
        event.data as unknown as Record<string, unknown>,
      );
      return NextResponse.json({ received: true });
    }

    console.warn(`Webhook received for unknown reference: ${reference}`);
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    // Return 200 to prevent Paystack from retrying for application errors
    return NextResponse.json({ received: true });
  }
}

// ─── Group Buy Contribution Processing ────────────────────────────

async function processGroupBuyContribution(
  contributionId: string,
  amountKobo: number,
  paystackData: Record<string, unknown>,
) {
  await prisma.$transaction(async (tx) => {
    // Mark contribution as successful
    const contribution = await tx.groupBuyContribution.update({
      where: { id: contributionId },
      data: {
        status: "SUCCESS",
        paystackData: paystackData as Record<
          string,
          string | number | boolean | null
        >,
      },
    });

    // Increment amount raised
    const groupBuy = await tx.groupBuy.update({
      where: { id: contribution.groupBuyId },
      data: { amountRaised: { increment: amountKobo } },
      include: {
        product: true,
        creator: { select: { id: true, email: true, name: true } },
      },
    });

    // Check if fully funded
    if (
      groupBuy.amountRaised >= groupBuy.targetAmount &&
      groupBuy.status === "OPEN"
    ) {
      // Create order for the creator
      const priceLockExpiresAt = new Date();
      priceLockExpiresAt.setDate(
        priceLockExpiresAt.getDate() + groupBuy.product.priceLockDays,
      );

      const order = await tx.order.create({
        data: {
          userId: groupBuy.creatorId,
          productId: groupBuy.productId,
          quantity: groupBuy.quantity,
          selectedColor: groupBuy.selectedColor,
          selectedSize: groupBuy.selectedSize,
          totalAmount: groupBuy.product.markupPrice * groupBuy.quantity,
          amountPaid: groupBuy.product.markupPrice * groupBuy.quantity,
          status: "PAID",
          isDepositPaid: true,
          completedAt: new Date(),
          priceLockExpiresAt,
          installmentMonths: 1,
          customSelections: { Fulfillment: "Group Buy" },
        },
      });

      await tx.groupBuy.update({
        where: { id: groupBuy.id },
        data: { status: "FUNDED", orderId: order.id, completedAt: new Date() },
      });

      // Send ownership proof emails to all successful contributors
      const allContributions = await tx.groupBuyContribution.findMany({
        where: { groupBuyId: groupBuy.id, status: "SUCCESS" },
      });

      // Send emails async (after transaction)
      setTimeout(() => {
        sendOwnershipEmails(
          allContributions,
          groupBuy.product.name,
          groupBuy.targetAmount,
          groupBuy.slug,
        ).catch(console.error);
      }, 0);
    }
  });
}

async function sendOwnershipEmails(
  contributions: Array<{ email: string; name: string | null; amount: number }>,
  productName: string,
  totalAmount: number,
  slug: string,
) {
  for (const c of contributions) {
    const ownershipPercent =
      Math.round((c.amount / totalAmount) * 100 * 100) / 100;
    await sendEmail({
      to: c.email,
      subject: `Your ownership proof — ${productName}`,
      react: React.createElement(GroupBuyOwnershipEmail, {
        contributorName: c.name || "Contributor",
        productName,
        amountContributed: formatNaira(c.amount),
        ownershipPercent,
        groupBuySlug: slug,
      }),
    });
  }
}

// ─── Help Me Pay Contribution Processing ──────────────────────────

interface HmpNotifyData {
  creatorId: string;
  creatorEmail: string;
  creatorName: string | null;
  productName: string;
  contributorName: string | null;
  contributorEmail: string | null;
  contributionAmount: number;
  isFunded: boolean;
  orderId: string | null;
  campaignSlug: string;
}

async function processHelpMePayContribution(
  contributionId: string,
  amountKobo: number,
  paystackData: Record<string, unknown>,
) {
  let notifyData: HmpNotifyData | null = null;

  await prisma.$transaction(async (tx) => {
    // 1. Mark contribution as successful
    const contribution = await tx.helpMePayContribution.update({
      where: { id: contributionId },
      data: {
        status: "SUCCESS",
        paystackData: paystackData as Record<
          string,
          string | number | boolean | null
        >,
      },
    });

    // 2. Increment amount raised
    const helpMePay = await tx.helpMePay.update({
      where: { id: contribution.helpMePayId },
      data: { amountRaised: { increment: amountKobo } },
      include: {
        product: true,
        creator: { select: { id: true, email: true, name: true } },
      },
    });

    const isFunded = helpMePay.amountRaised >= helpMePay.targetAmount;
    let finalOrderId = helpMePay.orderId;

    // 3. Apply payment to linked order (order-linked campaign)
    if (helpMePay.orderId) {
      const order = await tx.order.findUniqueOrThrow({
        where: { id: helpMePay.orderId },
      });

      if (!["PAID", "CANCELLED", "EXPIRED"].includes(order.status)) {
        const newAmountPaid = order.amountPaid + amountKobo;
        const isFullyPaid = newAmountPaid >= order.totalAmount;
        const depositThreshold = Math.round(order.totalAmount * 0.2);
        const isNowDepositPaid = newAmountPaid >= depositThreshold;

        await tx.order.update({
          where: { id: order.id },
          data: {
            amountPaid: newAmountPaid,
            isDepositPaid: isNowDepositPaid || order.isDepositPaid,
            status: isFullyPaid ? "PAID" : "PARTIAL",
            completedAt: isFullyPaid ? new Date() : null,
          },
        });
      }
    }

    // 4. Product-first campaign fully funded: create order
    if (
      isFunded &&
      !helpMePay.orderId &&
      helpMePay.productId &&
      helpMePay.product
    ) {
      const priceLockExpiresAt = new Date();
      priceLockExpiresAt.setDate(
        priceLockExpiresAt.getDate() + helpMePay.product.priceLockDays,
      );

      const order = await tx.order.create({
        data: {
          userId: helpMePay.creatorId,
          productId: helpMePay.productId,
          quantity: helpMePay.quantity,
          selectedColor: helpMePay.selectedColor,
          selectedSize: helpMePay.selectedSize,
          totalAmount: helpMePay.product.markupPrice * helpMePay.quantity,
          amountPaid: helpMePay.product.markupPrice * helpMePay.quantity,
          status: "PAID",
          isDepositPaid: true,
          completedAt: new Date(),
          priceLockExpiresAt,
          installmentMonths: 1,
          customSelections: { Fulfillment: "Help Me Pay" },
        },
      });

      finalOrderId = order.id;
      await tx.helpMePay.update({
        where: { id: helpMePay.id },
        data: { orderId: order.id, isActive: false },
      });
    } else if (isFunded) {
      // Order-linked campaign: just deactivate
      await tx.helpMePay.update({
        where: { id: helpMePay.id },
        data: { isActive: false },
      });
    }

    notifyData = {
      creatorId: helpMePay.creatorId,
      creatorEmail: helpMePay.creator.email,
      creatorName: helpMePay.creator.name,
      productName: helpMePay.product?.name ?? "your product",
      contributorName: contribution.name,
      contributorEmail: contribution.email,
      contributionAmount: amountKobo,
      isFunded,
      orderId: finalOrderId,
      campaignSlug: helpMePay.slug,
    };
  });

  if (!notifyData) return;
    const nd = notifyData as HmpNotifyData;
  // 5. Notify creator of every contribution
  notificationService
    .queue({
      userId: nd.creatorId,
      orderId: nd.orderId ?? undefined,
      channel: "WHATSAPP",
      type: "CAMPAIGN_CONTRIBUTION",
      message: `${nd.contributorName ?? "Someone"} contributed ${formatNaira(nd.contributionAmount)} to your Help Me Pay campaign for ${nd.productName}!`,
    })
    .catch(console.error);

  // 6. If fully funded: notify + email creator
  if (nd.isFunded) {
    notificationService
      .queue({
        userId: nd.creatorId,
        orderId: nd.orderId ?? undefined,
        channel: "WHATSAPP",
        type: "CAMPAIGN_FUNDED",
        message: `Your Help Me Pay campaign for ${nd.productName} is fully funded! Your order has been placed.`,
      })
      .catch(console.error);

    setTimeout(() => {
      sendCampaignFundedEmail(nd).catch(console.error);
    }, 0);
  }

  // 7. Email contributor receipt
  if (nd.contributorEmail) {
    setTimeout(() => {
      sendContributionReceiptEmail(nd).catch(console.error);
    }, 0);
  }
}

async function sendCampaignFundedEmail(nd: HmpNotifyData) {
  await sendEmail({
    to: nd.creatorEmail,
    subject: "Your Help Me Pay campaign is fully funded!",
    react: React.createElement(HelpMePayFundedEmail, {
      creatorName: nd.creatorName ?? nd.creatorEmail.split("@")[0],
      productName: nd.productName,
      totalAmount: formatNaira(nd.contributionAmount),
      orderId: nd.orderId,
      campaignSlug: nd.campaignSlug,
    }),
  });
}

async function sendContributionReceiptEmail(nd: HmpNotifyData) {
  if (!nd.contributorEmail) return;
  await sendEmail({
    to: nd.contributorEmail,
    subject: `Your contribution to ${nd.creatorName ?? "a friend"}'s campaign`,
    react: React.createElement(HelpMePayContributionReceiptEmail, {
      contributorName: nd.contributorName ?? "Contributor",
      productName: nd.productName,
      amountContributed: formatNaira(nd.contributionAmount),
      campaignSlug: nd.campaignSlug,
      creatorName: nd.creatorName ?? "your friend",
    }),
  });
}
