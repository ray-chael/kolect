"use server";

import { prisma } from "@/lib/db";
import { requireSession, getSession } from "@/lib/session";
import type { ActionResult } from "@/lib/types";
import { generateSlug } from "@/lib/utils";
import { calculateInterest, deadlineFromDays } from "@/lib/utils/interest";
import { DEADLINE_OPTIONS, MIN_HELPER_CONTRIBUTION_KOBO } from "@/lib/consts";
import { v4 as uuidv4 } from "uuid";
import { PAYSTACK_ENDPOINTS } from "@/lib/consts";
import type { PaystackInitResponse } from "@/lib/types";

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY!;

// ─── Create a Group Buy ───────────────────────────────────────────

export async function createGroupBuy(
  formData: FormData,
): Promise<ActionResult<{ slug: string }>> {
  try {
    const session = await requireSession();
    const productId = formData.get("productId") as string;
    const title = (formData.get("title") as string)?.trim();
    const splitType = (formData.get("splitType") as string) || "FLEXIBLE";
    const maxMembers = Number(formData.get("maxMembers") || 10);
    const deadlineDays = Number(formData.get("deadlineDays") || 30);
    const selectedColor = (formData.get("selectedColor") as string) || undefined;
    const selectedSize = (formData.get("selectedSize") as string) || undefined;

    if (!productId) return { success: false, message: "Product is required" };
    if (!title || title.length < 3) return { success: false, message: "Title must be at least 3 characters" };
    if (maxMembers < 2 || maxMembers > 50) return { success: false, message: "Max members must be between 2 and 50" };

    const validDeadline = DEADLINE_OPTIONS.find((d) => d.days === deadlineDays);
    if (!validDeadline) return { success: false, message: "Invalid deadline option" };

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || product.status !== "AVAILABLE") {
      return { success: false, message: "Product is not available" };
    }

    if (product.colors.length > 0 && !selectedColor) {
      return { success: false, message: "Please choose a color" };
    }
    if (product.sizes.length > 0 && !selectedSize) {
      return { success: false, message: "Please choose a size" };
    }

    const { interestPercent, totalAmount } = calculateInterest(
      product.markupPrice,
      deadlineDays,
    );

    const slug = `${generateSlug(title)}-${uuidv4().slice(0, 8)}`;

    const groupBuy = await prisma.groupBuy.create({
      data: {
        productId,
        creatorId: session.user.id,
        title,
        slug,
        quantity: 1,
        selectedColor: selectedColor || null,
        selectedSize: selectedSize || null,
        splitType: splitType === "EQUAL" ? "EQUAL" : "FLEXIBLE",
        targetAmount: totalAmount,
        interestPercent,
        maxMembers,
        expiresAt: deadlineFromDays(deadlineDays),
      },
    });

    return {
      success: true,
      message: "Group buy created! Share the link with friends.",
      data: { slug: groupBuy.slug },
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to create group buy",
    };
  }
}

// ─── Get Group Buy Details ────────────────────────────────────────

export async function getGroupBuy(slug: string) {
  return prisma.groupBuy.findUnique({
    where: { slug },
    include: {
      product: true,
      creator: { select: { id: true, name: true, image: true } },
      contributions: {
        where: { status: "SUCCESS" },
        select: { id: true, name: true, amount: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      },
      order: { select: { id: true, status: true } },
    },
  });
}

// ─── Contribute to Group Buy ──────────────────────────────────────

export async function contributeToGroupBuy(
  formData: FormData,
): Promise<ActionResult<{ authorizationUrl: string }>> {
  try {
    const groupBuyId = formData.get("groupBuyId") as string;
    const name = (formData.get("name") as string)?.trim();
    const email = (formData.get("email") as string)?.trim().toLowerCase();
    const amountKobo = Number(formData.get("amount"));

    if (!groupBuyId) return { success: false, message: "Group buy is required" };
    if (!name) return { success: false, message: "Name is required" };
    if (!email || !email.includes("@")) return { success: false, message: "Valid email is required" };
    if (!amountKobo || amountKobo < MIN_HELPER_CONTRIBUTION_KOBO) {
      return { success: false, message: "Minimum contribution is ₦1,000" };
    }

    const groupBuy = await prisma.groupBuy.findUnique({
      where: { id: groupBuyId },
      include: { product: true },
    });

    if (!groupBuy || groupBuy.status !== "OPEN") {
      return { success: false, message: "This group buy is no longer accepting contributions" };
    }

    if (new Date() > groupBuy.expiresAt) {
      return { success: false, message: "This group buy has expired" };
    }

    const remaining = groupBuy.targetAmount - groupBuy.amountRaised;
    const cappedAmount = Math.min(amountKobo, remaining);

    if (cappedAmount < MIN_HELPER_CONTRIBUTION_KOBO && cappedAmount < remaining) {
      return { success: false, message: "Minimum contribution is ₦1,000" };
    }

    // Check if authenticated
    const session = await getSession();
    const userId = session?.user?.id || null;

    const reference = `gb_${groupBuyId}_${Date.now()}_${uuidv4().slice(0, 8)}`;

    // Create pending contribution
    await prisma.groupBuyContribution.create({
      data: {
        groupBuyId,
        userId,
        name,
        email,
        amount: cappedAmount,
        paystackRef: reference,
        status: "PENDING",
      },
    });

    // Initialize Paystack payment
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/group-buy/${groupBuy.slug}?payment=success`;

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
          type: "group_buy",
          group_buy_id: groupBuyId,
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

// ─── Get user's group buys ────────────────────────────────────────

export async function getUserGroupBuys(): Promise<ActionResult> {
  try {
    const session = await requireSession();
    const groupBuys = await prisma.groupBuy.findMany({
      where: { creatorId: session.user.id },
      include: {
        product: { select: { name: true, slug: true, images: true, markupPrice: true } },
        _count: { select: { contributions: { where: { status: "SUCCESS" } } } },
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, message: "Group buys retrieved", data: groupBuys };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to fetch group buys",
    };
  }
}
