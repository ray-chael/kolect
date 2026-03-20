"use server";

import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import type { ActionResult } from "@/lib/types";

export interface WishlistItemData {
  productId: string;
  product: {
    id: string;
    name: string;
    slug: string;
    images: string[];
    videos: string[];
    markupPrice: number;
  };
}

export async function getWishlistItems(): Promise<ActionResult<WishlistItemData[]>> {
  const session = await getSession();
  if (!session) return { success: false, message: "Not authenticated", data: [] };

  const items = await prisma.wishlistItem.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      product: {
        select: { id: true, name: true, slug: true, images: true, videos: true, markupPrice: true },
      },
    },
  });

  return {
    success: true,
    message: "Wishlist loaded",
    data: items.map((item) => ({
      productId: item.productId,
      product: item.product,
    })),
  };
}

export async function addToWishlist(productId: string): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { success: false, message: "Not authenticated" };

  await prisma.wishlistItem.upsert({
    where: { userId_productId: { userId: session.user.id, productId } },
    create: { userId: session.user.id, productId },
    update: {},
  });

  return { success: true, message: "Added to wishlist" };
}

export async function removeFromWishlist(productId: string): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { success: false, message: "Not authenticated" };

  await prisma.wishlistItem.deleteMany({
    where: { userId: session.user.id, productId },
  });

  return { success: true, message: "Removed from wishlist" };
}

export async function toggleWishlist(productId: string): Promise<ActionResult<{ wishlisted: boolean }>> {
  const session = await getSession();
  if (!session) return { success: false, message: "Not authenticated" };

  const existing = await prisma.wishlistItem.findUnique({
    where: { userId_productId: { userId: session.user.id, productId } },
  });

  if (existing) {
    await prisma.wishlistItem.delete({ where: { id: existing.id } });
    return { success: true, message: "Removed from wishlist", data: { wishlisted: false } };
  }

  await prisma.wishlistItem.create({
    data: { userId: session.user.id, productId },
  });
  return { success: true, message: "Added to wishlist", data: { wishlisted: true } };
}

/** Merge guest wishlist items after sign-in */
export async function syncWishlistFromGuest(
  productIds: string[],
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { success: false, message: "Not authenticated" };

  if (productIds.length === 0) return { success: true, message: "Nothing to sync" };

  const validProducts = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true },
  });
  const validIds = new Set(validProducts.map((p) => p.id));

  const operations = productIds
    .filter((id) => validIds.has(id))
    .map((productId) =>
      prisma.wishlistItem.upsert({
        where: { userId_productId: { userId: session.user.id, productId } },
        create: { userId: session.user.id, productId },
        update: {},
      }),
    );

  await prisma.$transaction(operations);

  return { success: true, message: "Wishlist synced" };
}
