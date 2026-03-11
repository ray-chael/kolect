import { prisma } from "@/lib/db";

export const pickupLocationService = {
  async getAll() {
    return prisma.pickupLocation.findMany({
      orderBy: [{ isActive: "desc" }, { state: "asc" }, { city: "asc" }, { name: "asc" }],
    });
  },

  async getActive() {
    return prisma.pickupLocation.findMany({
      where: { isActive: true },
      orderBy: [{ state: "asc" }, { city: "asc" }, { name: "asc" }],
    });
  },

  async create(data: {
    name: string;
    slug: string;
    description?: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    landmark?: string;
    contactName?: string;
    contactPhone?: string;
    pickupInstructions?: string;
    logisticsProvider?: "INTERNAL" | "SPEEDAF";
    externalReference?: string;
    isActive?: boolean;
  }) {
    return prisma.pickupLocation.create({ data });
  },

  async update(
    id: string,
    data: Partial<{
      name: string;
      slug: string;
      description: string;
      addressLine1: string;
      addressLine2: string | null;
      city: string;
      state: string;
      landmark: string | null;
      contactName: string | null;
      contactPhone: string | null;
      pickupInstructions: string | null;
      logisticsProvider: "INTERNAL" | "SPEEDAF";
      externalReference: string | null;
      isActive: boolean;
    }>,
  ) {
    return prisma.pickupLocation.update({ where: { id }, data });
  },

  async delete(id: string) {
    const orderCount = await prisma.order.count({ where: { pickupLocationId: id } });
    if (orderCount > 0) {
      throw new Error("Cannot delete a pickup location that already has orders");
    }

    return prisma.pickupLocation.delete({ where: { id } });
  },
};