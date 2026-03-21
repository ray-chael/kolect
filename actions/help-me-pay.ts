"use server";

import { prisma } from "@/lib/db";
import { requireSession, getSession } from "@/lib/session";
import type { ActionResult } from "@/lib/types";
import { calculateInterest, deadlineFromDays } from "@/lib/utils/interest";
import { DEADLINE_OPTIONS, MIN_HELPER_CONTRIBUTION_KOBO, PAYSTACK_ENDPOINTS } from "@/lib/consts";
import { v4 as uuidv4 } from "uuid";
import type { PaystackInitResponse } from "@/lib/types";
import { formatNaira } from "@/lib/types";
import { notificationService } from "@/lib/services/notification.service";
import { sendEmail } from "@/lib/email";
import React from "react";
import { HelpMePayFundedEmail } from "@/emails/help-me-pay-funded";
import { HelpMePayContributionReceiptEmail } from "@/emails/help-me-pay-contribution-receipt";

type HmpNotifyData = {
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
};

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY!;

// ─── Create a Help Me Pay Campaign ────────────────────────────────

export async function createHelpMePay(
  formData: FormData,
): Promise<ActionResult<{ slug: string }>> {
  try {
    const session = await requireSession();
    const orderId = formData.get("orderId") as string;
    const message = (formData.get("message") as string)?.trim() || null;
    const deadlineDays = Number(formData.get("deadlineDays") || 30);

    if (!orderId) return { success: false, message: "Order is required" };

    const validDeadline = DEADLINE_OPTIONS.find((d) => d.days === deadlineDays);
    if (!validDeadline)
      return { success: false, message: "Invalid deadline option" };

    // Verify order belongs to user and has remaining balance
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { product: true, helpMePay: true },
    });

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
        message: `Order is already ${order.status.toLowerCase()}`,
      };
    }

    if (order.helpMePay) {
      return {
        success: false,
        message: "A Help Me Pay campaign already exists for this order",
      };
    }

    const remainingBalance = order.totalAmount - order.amountPaid;
    if (remainingBalance <= 0) {
      return { success: false, message: "This order is already fully paid" };
    }

    const { interestAmount } = calculateInterest(
      remainingBalance,
      deadlineDays,
    );

    const slug = `help-${uuidv4().slice(0, 12)}`;

    const helpMePay = await prisma.helpMePay.create({
      data: {
        orderId,
        creatorId: session.user.id,
        slug,
        message,
        targetAmount: remainingBalance + interestAmount,
        interestAmount,
        expiresAt: deadlineFromDays(deadlineDays),
      },
    });

    return {
      success: true,
      message: "Help Me Pay link created! Share it with friends and family.",
      data: { slug: helpMePay.slug },
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to create campaign",
    };
  }
}

// ─── Create a Help Me Pay Campaign from a Product ────────────────

export async function createHelpMePayFromProduct(
  formData: FormData,
): Promise<ActionResult<{ slug: string }>> {
  try {
    const session = await requireSession();
    const productId = formData.get("productId") as string;
    const quantity = Math.max(1, Number(formData.get("quantity") || 1));
    const selectedColor =
      (formData.get("selectedColor") as string)?.trim() || null;
    const selectedSize =
      (formData.get("selectedSize") as string)?.trim() || null;
    const message = (formData.get("message") as string)?.trim() || null;
    const deadlineDays = Number(formData.get("deadlineDays") || 30);

    if (!productId) return { success: false, message: "Product is required" };

    const validDeadline = DEADLINE_OPTIONS.find((d) => d.days === deadlineDays);
    if (!validDeadline)
      return { success: false, message: "Invalid deadline option" };

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product || product.status !== "AVAILABLE") {
      return { success: false, message: "Product not found or unavailable" };
    }

    // Prevent duplicate active campaigns for the same product
    const existing = await prisma.helpMePay.findFirst({
      where: {
        creatorId: session.user.id,
        productId,
        isActive: true,
        expiresAt: { gt: new Date() },
      },
    });
    if (existing) {
      return {
        success: false,
        message:
          "You already have an active Help Me Pay campaign for this product",
      };
    }

    const baseAmount = product.markupPrice * quantity;
    const { interestAmount } = calculateInterest(baseAmount, deadlineDays);
    const slug = `help-${uuidv4().slice(0, 12)}`;

    const helpMePay = await prisma.helpMePay.create({
      data: {
        productId,
        quantity,
        selectedColor,
        selectedSize,
        creatorId: session.user.id,
        slug,
        message,
        targetAmount: baseAmount + interestAmount,
        interestAmount,
        expiresAt: deadlineFromDays(deadlineDays),
      },
    });

    return {
      success: true,
      message: "Help Me Pay campaign created! Share the link with friends.",
      data: { slug: helpMePay.slug },
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to create campaign",
    };
  }
}

// ─── Check if user has an active campaign for a product ──────────

export async function getUserHelpMePayForProduct(productId: string) {
  try {
    const session = await getSession();
    if (!session?.user?.id) return null;
    return await prisma.helpMePay.findFirst({
      where: {
        creatorId: session.user.id,
        productId,
        isActive: true,
        expiresAt: { gt: new Date() },
      },
    });
  } catch {
    return null;
  }
}

// ─── Get Help Me Pay Details ──────────────────────────────────────

export async function getHelpMePay(slug: string) {
  return prisma.helpMePay.findUnique({
    where: { slug },
    include: {
      product: true,
      order: {
        include: { product: true },
      },
      creator: { select: { id: true, name: true, image: true } },
      contributions: {
        where: { status: "SUCCESS" },
        select: { id: true, name: true, amount: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

// ─── Contribute to Help Me Pay ────────────────────────────────────

export async function contributeToHelpMePay(
  formData: FormData,
): Promise<ActionResult<{ authorizationUrl: string }>> {
  try {
    const helpMePayId = formData.get("helpMePayId") as string;
    const name = (formData.get("name") as string)?.trim();
    const email = (formData.get("email") as string)?.trim().toLowerCase();
    const amountKobo = Number(formData.get("amount"));

    if (!helpMePayId)
      return { success: false, message: "Campaign is required" };
    if (!name) return { success: false, message: "Name is required" };
    if (!email || !email.includes("@"))
      return { success: false, message: "Valid email is required" };
    if (!amountKobo || amountKobo < MIN_HELPER_CONTRIBUTION_KOBO) {
      return { success: false, message: "Minimum contribution is ₦1,000" };
    }

    const helpMePay = await prisma.helpMePay.findUnique({
      where: { id: helpMePayId },
      include: { order: { include: { product: true } } },
    });

    if (!helpMePay || !helpMePay.isActive) {
      return { success: false, message: "This campaign is no longer active" };
    }

    if (new Date() > helpMePay.expiresAt) {
      return { success: false, message: "This campaign has expired" };
    }

    const remaining = helpMePay.targetAmount - helpMePay.amountRaised;
    const cappedAmount = Math.min(amountKobo, remaining);

    if (
      cappedAmount < MIN_HELPER_CONTRIBUTION_KOBO &&
      cappedAmount < remaining
    ) {
      return { success: false, message: "Minimum contribution is ₦1,000" };
    }

    // Check if authenticated
    const session = await getSession();
    const userId = session?.user?.id || null;

    const reference = `hmp_${helpMePayId}_${Date.now()}_${uuidv4().slice(0, 8)}`;

    // Create pending contribution
    await prisma.helpMePayContribution.create({
      data: {
        helpMePayId,
        contributorId: userId,
        name,
        email,
        amount: cappedAmount,
        paystackRef: reference,
        status: "PENDING",
      },
    });

    // Initialize Paystack payment
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/help-me-pay/${helpMePay.slug}?payment=success`;

    const res = await fetch(PAYSTACK_ENDPOINTS.INITIALIZE, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: cappedAmount,
        reference,
        callback_url: callbackUrl,
        metadata: {
          type: "help_me_pay",
          help_me_pay_id: helpMePayId,
          order_id: helpMePay.orderId,
          contributor_name: name,
        },
      }),
    });

    if (!res.ok) {
      throw new Error("Failed to initialize payment");
    }

    const data = (await res.json()) as PaystackInitResponse;

    return {
      success: true,
      message: "Payment initialized",
      data: { authorizationUrl: data.data.authorization_url },
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to contribute",
    };
  }
}

// ─── Get user's help me pay campaigns ─────────────────────────────

export async function getUserHelpMePays(): Promise<ActionResult> {
  try {
    const session = await requireSession();
    const campaigns = await prisma.helpMePay.findMany({
      where: { creatorId: session.user.id },
      include: {
        product: {
          select: { name: true, slug: true, images: true, videos: true },
        },
        order: {
          include: {
            product: {
              select: { name: true, slug: true, images: true, videos: true },
            },
          },
        },
        _count: { select: { contributions: { where: { status: "SUCCESS" } } } },
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, message: "Campaigns retrieved", data: campaigns };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to fetch campaigns",
    };
  }
}

// ─── Verify & process a contribution (fallback for missed webhooks) ──

/**
 * Called when the user is redirected back from Paystack with ?payment=success.
 * Idempotent — safe to call even if the webhook already processed the payment.
 */
export async function verifyAndProcessHmpContribution(
  reference: string,
): Promise<void> {
  if (!reference) return;
  try {
    const contribution = await prisma.helpMePayContribution.findUnique({
      where: { paystackRef: reference },
      select: { id: true, status: true, helpMePayId: true },
    });

    // Nothing to do — already processed or not found
    if (!contribution || contribution.status === "SUCCESS") return;

    // Verify with Paystack
    const res = await fetch(PAYSTACK_ENDPOINTS.VERIFY(reference), {
      method: "GET",
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
      cache: "no-store",
    });

    if (!res.ok) return;

    const data = (await res.json()) as {
      data?: { status?: string; amount?: number };
    };
    if (data?.data?.status !== "success") return;

    const amountKobo = data.data.amount as number;
    let notifyData: HmpNotifyData | null = null;

    await prisma.$transaction(async (tx) => {
      // Re-check inside transaction to prevent race condition with webhook
      const fresh = await tx.helpMePayContribution.findUniqueOrThrow({
        where: { id: contribution.id },
        select: { status: true },
      });
      if (fresh.status === "SUCCESS") return;

      const updatedContribution = await tx.helpMePayContribution.update({
        where: { id: contribution.id },
        data: {
          status: "SUCCESS",
          paystackData: data.data as Record<
            string,
            string | number | boolean | null
          >,
        },
      });

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

      // Apply payment to linked order (order-linked campaign)
      if (helpMePay.orderId) {
        const order = await tx.order.findUnique({
          where: { id: helpMePay.orderId },
        });
        if (order && !["PAID", "CANCELLED", "EXPIRED"].includes(order.status)) {
          const newAmountPaid = order.amountPaid + amountKobo;
          const isFullyPaid = newAmountPaid >= order.totalAmount;
          const depositThreshold = Math.round(order.totalAmount * 0.2);
          await tx.order.update({
            where: { id: order.id },
            data: {
              amountPaid: newAmountPaid,
              status: isFullyPaid ? "PAID" : "PARTIAL",
              isDepositPaid:
                newAmountPaid >= depositThreshold || order.isDepositPaid,
              completedAt: isFullyPaid ? new Date() : null,
            },
          });
        }
      }

      // Product-first campaign fully funded: create order
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
        contributorName: updatedContribution.name,
        contributorEmail: updatedContribution.email,
        contributionAmount: amountKobo,
        isFunded,
        orderId: finalOrderId,
        campaignSlug: helpMePay.slug,
      };
    });

    if (!notifyData) return;
    const nd = notifyData as HmpNotifyData;

    notificationService
      .queue({
        userId: nd.creatorId,
        orderId: nd.orderId ?? undefined,
        channel: "WHATSAPP",
        type: "CAMPAIGN_CONTRIBUTION",
        message: `${nd.contributorName ?? "Someone"} contributed ${formatNaira(nd.contributionAmount)} to your Help Me Pay campaign for ${nd.productName}!`,
      })
      .catch(console.error);

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

      sendEmail({
        to: nd.creatorEmail,
        subject: "Your Help Me Pay campaign is fully funded!",
        react: React.createElement(HelpMePayFundedEmail, {
          creatorName: nd.creatorName ?? nd.creatorEmail.split("@")[0],
          productName: nd.productName,
          totalAmount: formatNaira(nd.contributionAmount),
          orderId: nd.orderId,
          campaignSlug: nd.campaignSlug,
        }),
      }).catch(console.error);
    }

    if (nd.contributorEmail) {
      sendEmail({
        to: nd.contributorEmail,
        subject: `Your contribution to ${nd.creatorName ?? "a friend"}'s campaign`,
        react: React.createElement(HelpMePayContributionReceiptEmail, {
          contributorName: nd.contributorName ?? "Contributor",
          productName: nd.productName,
          amountContributed: formatNaira(nd.contributionAmount),
          campaignSlug: nd.campaignSlug,
          creatorName: nd.creatorName ?? "your friend",
        }),
      }).catch(console.error);
    }
  } catch (err) {
    console.error("[verifyAndProcessHmpContribution]", err);
  }
}
