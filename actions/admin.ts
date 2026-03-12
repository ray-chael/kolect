"use server";

import { requireRole } from "@/lib/session";
import { productService } from "@/lib/services/product.service";
import { orderService } from "@/lib/services/order.service";
import { createProductSchema, updateProductSchema, updateOrderStatusSchema } from "@/lib/schemas";
import { generateSlug } from "@/lib/utils";
import type { ActionResult } from "@/lib/types";
import { notificationService } from "@/lib/services/notification.service";
import { emailService } from "@/lib/services/email.service";

function parseJsonField<T>(value: FormDataEntryValue | null, fallback: T): T {
  if (typeof value !== "string" || value.trim() === "") return fallback;

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

// ─── Product Management ────────────────────────────────────────

export async function createProduct(formData: FormData): Promise<ActionResult> {
  try {
    const session = await requireRole("CRIMSON"); // Admin only

    const images = formData.getAll("images").filter(Boolean).map(String);
    const videos = formData.getAll("videos").filter(Boolean).map(String);
    const colors = parseJsonField<string[]>(formData.get("colors"), []).filter(
      Boolean,
    );
    const sizes = parseJsonField<string[]>(formData.get("sizes"), []).filter(
      Boolean,
    );
    const customFields = parseJsonField(formData.get("customFields"), []);

    const rawData = {
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || undefined,
      images,
      videos,
      colors,
      sizes,
      customFields,
      originalCost: Number(formData.get("originalCost")),
      markupPrice: Number(formData.get("markupPrice")),
      weightKg: Number(formData.get("weightKg")),
      moq: Number(formData.get("moq") || 1),
      isPreorder: formData.get("isPreorder") === "true",
      expectedProcurementAt: formData.get("expectedProcurementAt")
        ? new Date(formData.get("expectedProcurementAt") as string)
        : undefined,
      priceLockDays: Number(formData.get("priceLockDays") || 60),
      categoryId: (formData.get("categoryId") as string) || undefined,
    };

    const parsed = createProductSchema.safeParse(rawData);
    if (!parsed.success) {
      return {
        success: false,
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const slug = generateSlug(parsed.data.name);
    const product = await productService.create({ ...parsed.data, slug });

    // Audit
    const { prisma } = await import("@/lib/db");
    await prisma.adminAction.create({
      data: {
        adminUserId: session.user.id,
        action: "CREATE_PRODUCT",
        targetType: "Product",
        targetId: product.id,
      },
    });

    return {
      success: true,
      message: "Product created",
      data: product,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to create product",
    };
  }
}

export async function updateProduct(
  productId: string,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await requireRole("CRIMSON");

    const rawData: Record<string, unknown> = {};
    for (const [key, value] of formData.entries()) {
      if (key !== "images" && key !== "videos" && value !== "")
        rawData[key] = value;
    }
    const images = formData.getAll("images").filter(Boolean).map(String);
    if (images.length > 0) rawData.images = images;
    const videos = formData.getAll("videos").filter(Boolean).map(String);
    rawData.videos = videos;
    rawData.colors = parseJsonField<string[]>(
      formData.get("colors"),
      [],
    ).filter(Boolean);
    rawData.sizes = parseJsonField<string[]>(formData.get("sizes"), []).filter(
      Boolean,
    );
    rawData.customFields = parseJsonField(formData.get("customFields"), []);

    if (rawData.originalCost)
      rawData.originalCost = Number(rawData.originalCost);
    if (rawData.markupPrice) rawData.markupPrice = Number(rawData.markupPrice);
    if (rawData.weightKg) rawData.weightKg = Number(rawData.weightKg);
    if (rawData.moq) rawData.moq = Number(rawData.moq);
    if (rawData.priceLockDays)
      rawData.priceLockDays = Number(rawData.priceLockDays);
    if (rawData.isPreorder) rawData.isPreorder = rawData.isPreorder === "true";
    if (formData.has("categoryId") && !formData.get("categoryId"))
      rawData.categoryId = null;

    const parsed = updateProductSchema.safeParse(rawData);
    if (!parsed.success) {
      return {
        success: false,
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const product = await productService.update(productId, parsed.data);
    return { success: true, message: "Product updated", data: product };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to update product",
    };
  }
}

// ─── Order Fulfillment ─────────────────────────────────────────

export async function updateOrderStatus(
  formData: FormData,
): Promise<ActionResult> {
  try {
    const session = await requireRole("CRIMSON");

    const rawData = {
      orderId: formData.get("orderId") as string,
      status: formData.get("status") as string,
      riderName: (formData.get("riderName") as string) || undefined,
      riderPhone: (formData.get("riderPhone") as string) || undefined,
      trackingNote: (formData.get("trackingNote") as string) || undefined,
    };

    const parsed = updateOrderStatusSchema.safeParse(rawData);
    if (!parsed.success) {
      return {
        success: false,
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const order = await orderService.updateStatus(parsed.data.orderId, {
      status: parsed.data.status,
      riderName: parsed.data.riderName,
      riderPhone: parsed.data.riderPhone,
      trackingNote: parsed.data.trackingNote,
      adminUserId: session.user.id,
    });

    // Send notification based on status change
    const notificationMap: Record<
      string,
      {
        type: "ITEM_PROCURED" | "OUT_FOR_DELIVERY" | "DELIVERED";
        message: string;
      }
    > = {
      PROCURED: {
        type: "ITEM_PROCURED",
        message: `Great news! Your item has been procured and is being prepared for dispatch.`,
      },
      DISPATCHED: {
        type: "OUT_FOR_DELIVERY",
        message: `Your order is out for delivery! Rider: ${parsed.data.riderName || "Assigned"}, Phone: ${parsed.data.riderPhone || "N/A"}.`,
      },
      DELIVERED: {
        type: "DELIVERED",
        message: `Your order has been delivered. Thank you for shopping with Ade's Kolekt!`,
      },
    };

    const notification = notificationMap[parsed.data.status];
    if (notification) {
      await notificationService.queue({
        userId: order.userId,
        orderId: order.id,
        channel: "WHATSAPP",
        type: notification.type,
        message: notification.message,
      });
      emailService
        .send(notification.type, order.userId, order.id)
        .catch(console.error);
    }

    return {
      success: true,
      message: `Order status updated to ${parsed.data.status}`,
      data: order,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to update order status",
    };
  }
}

/**
 * Get all orders ready for procurement (admin view)
 */
export async function getProcurementQueue(): Promise<ActionResult> {
  try {
    await requireRole("CRIMSON");
    const orders = await orderService.getReadyForProcurement();
    return { success: true, message: "Procurement queue retrieved", data: orders };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to fetch procurement queue",
    };
  }
}
