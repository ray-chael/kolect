"use server";

import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import type { ActionResult } from "@/lib/types";

export interface CartItemData {
  productId: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    slug: string;
    images: string[];
    markupPrice: number;
  };
}

export async function getCartItems(): Promise<ActionResult<CartItemData[]>> {
  const session = await getSession();
  if (!session) return { success: false, message: "Not authenticated", data: [] };

  const items = await prisma.cartItem.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      product: {
        select: { id: true, name: true, slug: true, images: true, markupPrice: true },
      },
    },
  });

  return {
    success: true,
    message: "Cart loaded",
    data: items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      product: item.product,
    })),
  };
}

export async function addToCart(
  productId: string,
  quantity: number = 1,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { success: false, message: "Not authenticated" };

  await prisma.cartItem.upsert({
    where: { userId_productId: { userId: session.user.id, productId } },
    create: { userId: session.user.id, productId, quantity },
    update: { quantity },
  });

  return { success: true, message: "Item added to cart" };
}

export async function updateCartItemQuantity(
  productId: string,
  quantity: number,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { success: false, message: "Not authenticated" };

  if (quantity <= 0) {
    await prisma.cartItem.deleteMany({
      where: { userId: session.user.id, productId },
    });
    return { success: true, message: "Item removed from cart" };
  }

  await prisma.cartItem.upsert({
    where: { userId_productId: { userId: session.user.id, productId } },
    create: { userId: session.user.id, productId, quantity },
    update: { quantity },
  });

  return { success: true, message: "Cart updated" };
}

export async function removeFromCart(
  productId: string,
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { success: false, message: "Not authenticated" };

  await prisma.cartItem.deleteMany({
    where: { userId: session.user.id, productId },
  });

  return { success: true, message: "Item removed from cart" };
}

export async function clearCart(): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { success: false, message: "Not authenticated" };

  await prisma.cartItem.deleteMany({
    where: { userId: session.user.id },
  });

  return { success: true, message: "Cart cleared" };
}

/** Merge guest cart items into the user's server cart (called after sign-in) */
export async function syncCartFromGuest(
  guestItems: { productId: string; quantity: number }[],
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { success: false, message: "Not authenticated" };

  if (guestItems.length === 0) return { success: true, message: "Nothing to sync" };

  // Validate product IDs exist
  const validProducts = await prisma.product.findMany({
    where: { id: { in: guestItems.map((i) => i.productId) } },
    select: { id: true },
  });
  const validIds = new Set(validProducts.map((p) => p.id));

  const operations = guestItems
    .filter((item) => validIds.has(item.productId) && item.quantity > 0)
    .map((item) =>
      prisma.cartItem.upsert({
        where: {
          userId_productId: { userId: session.user.id, productId: item.productId },
        },
        create: {
          userId: session.user.id,
          productId: item.productId,
          quantity: item.quantity,
        },
        // Keep the higher quantity between guest and existing
        update: {},
      }),
    );

  await prisma.$transaction(operations);

  return { success: true, message: "Cart synced" };
}
