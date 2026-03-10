import { prisma } from "@/lib/db";

export const productService = {
  /**
   * Get all available products
   */
  async getAll(options?: { category?: string; status?: string }) {
    return prisma.product.findMany({
      where: {
        status: (options?.status as "AVAILABLE") ?? "AVAILABLE",
        ...(options?.category ? { category: options.category } : {}),
      },
      orderBy: { createdAt: "desc" },
    });
  },

  /**
   * Get a product by slug
   */
  async getBySlug(slug: string) {
    return prisma.product.findUnique({ where: { slug } });
  },

  /**
   * Get a product by ID
   */
  async getById(id: string) {
    return prisma.product.findUnique({ where: { id } });
  },

  /**
   * Create a product (admin)
   */
  async create(data: {
    name: string;
    slug: string;
    description?: string;
    images?: string[];
    originalCost: number;
    markupPrice: number;
    moq?: number;
    isPreorder?: boolean;
    expectedProcurementAt?: Date;
    priceLockDays?: number;
    category?: string;
  }) {
    return prisma.product.create({ data });
  },

  /**
   * Update a product (admin)
   */
  async update(
    id: string,
    data: Partial<{
      name: string;
      slug: string;
      description: string;
      images: string[];
      originalCost: number;
      markupPrice: number;
      moq: number;
      isPreorder: boolean;
      expectedProcurementAt: Date;
      priceLockDays: number;
      category: string;
      status: "AVAILABLE" | "OUT_OF_STOCK" | "DISCONTINUED";
    }>
  ) {
    return prisma.product.update({ where: { id }, data });
  },
};
