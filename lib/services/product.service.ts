import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/db";
import type { ProductCustomField } from "@/lib/types";

function toJsonArray(
  value: ProductCustomField[] | undefined,
): Prisma.InputJsonValue {
  return (value ?? []) as unknown as Prisma.InputJsonValue;
}

export const productService = {
  /**
   * Get all available products
   */
  async getAll(options?: { categoryId?: string; status?: string }) {
    return prisma.product.findMany({
      where: {
        status: (options?.status as "AVAILABLE") ?? "AVAILABLE",
        ...(options?.categoryId ? { categoryId: options.categoryId } : {}),
      },
      include: { category: true },
      orderBy: { createdAt: "desc" },
    });
  },

  /**
   * Get a product by slug
   */
  async getBySlug(slug: string) {
    return prisma.product.findUnique({
      where: { slug },
      include: { category: true },
    });
  },

  /**
   * Get a product by ID
   */
  async getById(id: string) {
    return prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });
  },

  /**
   * Create a product (admin)
   */
  async create(data: {
    name: string;
    slug: string;
    description?: string;
    images?: string[];
    videos?: string[];
    colors?: string[];
    sizes?: string[];
    customFields?: ProductCustomField[];
    originalCost: number;
    markupPrice: number;
    moq?: number;
    isPreorder?: boolean;
    expectedProcurementAt?: Date;
    priceLockDays?: number;
    categoryId?: string | null;
  }) {
    const { categoryId, customFields, ...rest } = data;

    return prisma.product.create({
      data: {
        ...rest,
        customFields: toJsonArray(customFields),
        ...(categoryId ? { category: { connect: { id: categoryId } } } : {}),
      },
    });
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
      videos: string[];
      colors: string[];
      sizes: string[];
      customFields: ProductCustomField[];
      originalCost: number;
      markupPrice: number;
      moq: number;
      isPreorder: boolean;
      expectedProcurementAt: Date;
      priceLockDays: number;
      categoryId: string | null;
      status: "AVAILABLE" | "OUT_OF_STOCK" | "DISCONTINUED";
    }>,
  ) {
    const { categoryId, customFields, ...rest } = data;

    const productData: Prisma.ProductUpdateInput = {
      ...rest,
      ...(customFields ? { customFields: toJsonArray(customFields) } : {}),
      ...(categoryId !== undefined
        ? categoryId
          ? { category: { connect: { id: categoryId } } }
          : { category: { disconnect: true } }
        : {}),
    };

    return prisma.product.update({
      where: { id },
      data: productData,
    });
  },
};
