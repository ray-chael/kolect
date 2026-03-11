"use server";

import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { z } from "zod/v4";
import type { ActionResult } from "@/lib/types";

const addressSchema = z.object({
  label: z.string().min(1).max(50).default("Home"),
  recipientName: z.string().min(2, "Recipient name is required"),
  phone: z.string().min(7, "Phone number is required"),
  addressLine1: z.string().min(5, "Address is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
});

export async function createAddress(formData: FormData): Promise<ActionResult> {
  try {
    const session = await requireSession();

    const parsed = addressSchema.safeParse({
      label: formData.get("label") || "Home",
      recipientName: formData.get("recipientName"),
      phone: formData.get("phone"),
      addressLine1: formData.get("addressLine1"),
      addressLine2: formData.get("addressLine2") || undefined,
      city: formData.get("city"),
      state: formData.get("state"),
    });

    if (!parsed.success) {
      return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid data" };
    }

    // If this is the first address, make it default
    const existingCount = await prisma.deliveryAddress.count({
      where: { userId: session.user.id },
    });

    await prisma.deliveryAddress.create({
      data: {
        ...parsed.data,
        userId: session.user.id,
        isDefault: existingCount === 0,
      },
    });

    return { success: true, message: "" };
  } catch {
    return { success: false, message: "Failed to create address" };
  }
}

export async function updateAddress(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    const session = await requireSession();

    const address = await prisma.deliveryAddress.findUnique({ where: { id } });
    if (!address || address.userId !== session.user.id) {
      return { success: false, message: "Address not found" };
    }

    const parsed = addressSchema.safeParse({
      label: formData.get("label") || "Home",
      recipientName: formData.get("recipientName"),
      phone: formData.get("phone"),
      addressLine1: formData.get("addressLine1"),
      addressLine2: formData.get("addressLine2") || undefined,
      city: formData.get("city"),
      state: formData.get("state"),
    });

    if (!parsed.success) {
      return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid data" };
    }

    await prisma.deliveryAddress.update({
      where: { id },
      data: parsed.data,
    });

    return { success: true, message: "" };
  } catch {
    return { success: false, message: "Failed to update address" };
  }
}

export async function deleteAddress(id: string): Promise<ActionResult> {
  try {
    const session = await requireSession();

    const address = await prisma.deliveryAddress.findUnique({ where: { id } });
    if (!address || address.userId !== session.user.id) {
      return { success: false, message: "Address not found" };
    }

    await prisma.deliveryAddress.delete({ where: { id } });

    // If deleted address was the default, promote the next available one
    if (address.isDefault) {
      const next = await prisma.deliveryAddress.findFirst({
        where: { userId: session.user.id },
        orderBy: { createdAt: "asc" },
      });
      if (next) {
        await prisma.deliveryAddress.update({
          where: { id: next.id },
          data: { isDefault: true },
        });
      }
    }

    return { success: true, message: "" };
  } catch {
    return { success: false, message: "Failed to delete address" };
  }
}

export async function setDefaultAddress(id: string): Promise<ActionResult> {
  try {
    const session = await requireSession();

    const address = await prisma.deliveryAddress.findUnique({ where: { id } });
    if (!address || address.userId !== session.user.id) {
      return { success: false, message: "Address not found" };
    }

    // Clear the current default then set the new one
    await prisma.$transaction([
      prisma.deliveryAddress.updateMany({
        where: { userId: session.user.id },
        data: { isDefault: false },
      }),
      prisma.deliveryAddress.update({
        where: { id },
        data: { isDefault: true },
      }),
    ]);

    return { success: true, message: "" };
  } catch {
    return { success: false, message: "Failed to set default address" };
  }
}
