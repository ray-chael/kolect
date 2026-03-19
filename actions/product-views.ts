"use server";

import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

/**
 * Record a product view. Called from the product detail page client component.
 * Increments the denormalised viewCount on the product for fast sorting.
 */
export async function recordProductView(productId: string) {
  const session = await getSession();

  await prisma.$transaction([
    prisma.productView.create({
      data: {
        productId,
        userId: session?.user?.id ?? null,
      },
    }),
    prisma.product.update({
      where: { id: productId },
      data: { viewCount: { increment: 1 } },
    }),
  ]);
}
