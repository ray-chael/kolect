import { prisma } from "@/lib/db";

export const flashSaleService = {
  async getAll() {
    return prisma.flashSale.findMany({
      include: {
        product: {
          select: { id: true, name: true, slug: true, markupPrice: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async getById(id: string) {
    return prisma.flashSale.findUnique({
      where: { id },
      include: {
        product: {
          select: { id: true, name: true, markupPrice: true },
        },
      },
    });
  },

  /** Returns the cheapest active flash sale for a product, or null. */
  async getActiveForProduct(productId: string) {
    const now = new Date();
    return prisma.flashSale.findFirst({
      where: {
        productId,
        isActive: true,
        startsAt: { lte: now },
        endsAt: { gte: now },
      },
      orderBy: { salePrice: "asc" },
    });
  },

  async create(data: {
    productId: string;
    label: string;
    salePrice: number;
    startsAt: Date;
    endsAt: Date;
  }) {
    return prisma.flashSale.create({ data });
  },

  async update(
    id: string,
    data: Partial<{
      label: string;
      salePrice: number;
      startsAt: Date;
      endsAt: Date;
      isActive: boolean;
    }>,
  ) {
    return prisma.flashSale.update({ where: { id }, data });
  },

  async delete(id: string) {
    return prisma.flashSale.delete({ where: { id } });
  },
};
