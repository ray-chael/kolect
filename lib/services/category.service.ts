import { prisma } from "@/lib/db";

export const categoryService = {
  /**
   * Get all top-level categories with their children
   */
  async getAll() {
    return prisma.category.findMany({
      where: { parentId: null },
      include: { children: { orderBy: { name: "asc" } } },
      orderBy: { name: "asc" },
    });
  },

  /**
   * Get a flat list of all categories (for dropdowns)
   */
  async getAllFlat() {
    return prisma.category.findMany({
      include: { parent: true },
      orderBy: { name: "asc" },
    });
  },

  /**
   * Get a category by ID
   */
  async getById(id: string) {
    return prisma.category.findUnique({
      where: { id },
      include: { children: true, parent: true },
    });
  },

  /**
   * Create a category
   */
  async create(data: { name: string; slug: string; parentId?: string }) {
    return prisma.category.create({ data });
  },

  /**
   * Update a category
   */
  async update(
    id: string,
    data: Partial<{ name: string; slug: string; parentId: string | null }>
  ) {
    return prisma.category.update({ where: { id }, data });
  },

  /**
   * Delete a category (only if no products reference it)
   */
  async delete(id: string) {
    const productCount = await prisma.product.count({
      where: { categoryId: id },
    });
    if (productCount > 0) {
      throw new Error(
        "Cannot delete category with existing products. Reassign products first."
      );
    }

    // Also delete children that have no products
    const children = await prisma.category.findMany({
      where: { parentId: id },
    });
    for (const child of children) {
      const childProductCount = await prisma.product.count({
        where: { categoryId: child.id },
      });
      if (childProductCount > 0) {
        throw new Error(
          `Cannot delete: subcategory "${child.name}" has products.`
        );
      }
    }

    // Delete children first, then parent
    await prisma.category.deleteMany({ where: { parentId: id } });
    return prisma.category.delete({ where: { id } });
  },
};
