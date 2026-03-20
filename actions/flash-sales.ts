"use server";

import { requireRole } from "@/lib/session";
import { flashSaleService } from "@/lib/services/flash-sale.service";
import { productService } from "@/lib/services/product.service";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/types";

// ─── Utilities ─────────────────────────────────────────────────

function parseDate(value: FormDataEntryValue | null): Date | null {
  if (!value || typeof value !== "string" || value.trim() === "") return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

function revalidateFlashSalePaths() {
  revalidatePath("/admin/flash-sales");
  revalidatePath("/collection");
  revalidatePath("/");
}

// ─── Queries ───────────────────────────────────────────────────

export async function getAllFlashSales(): Promise<ActionResult> {
  try {
    await requireRole("CRIMSON");
    const sales = await flashSaleService.getAll();
    return { success: true, message: "Flash sales retrieved", data: sales };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to retrieve flash sales";
    return { success: false, message };
  }
}

export async function getFlashSaleById(id: string): Promise<ActionResult> {
  try {
    await requireRole("CRIMSON");
    const sale = await flashSaleService.getById(id);
    if (!sale) return { success: false, message: "Flash sale not found" };
    return { success: true, message: "Flash sale retrieved", data: sale };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to retrieve flash sale";
    return { success: false, message };
  }
}

/** Returns all products for the flash sale product dropdown. */
export async function getProductsForSale(): Promise<ActionResult> {
  try {
    await requireRole("CRIMSON");
    const products = await productService.getAll();
    return { success: true, message: "Products retrieved", data: products };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to retrieve products";
    return { success: false, message };
  }
}

// ─── Mutations ─────────────────────────────────────────────────

export async function createFlashSale(formData: FormData): Promise<ActionResult> {
  try {
    await requireRole("CRIMSON");

    const productId = (formData.get("productId") as string)?.trim();
    const label = ((formData.get("label") as string) || "Flash Sale").trim();
    const salePriceNaira = parseFloat((formData.get("salePrice") as string) || "");
    const startsAt = parseDate(formData.get("startsAt"));
    const endsAt = parseDate(formData.get("endsAt"));

    if (!productId) return { success: false, message: "Product is required" };
    if (isNaN(salePriceNaira) || salePriceNaira <= 0) return { success: false, message: "Sale price must be a positive number" };
    if (!startsAt) return { success: false, message: "Start date is required" };
    if (!endsAt) return { success: false, message: "End date is required" };
    if (endsAt <= startsAt) return { success: false, message: "End date must be after start date" };

    const product = await productService.getById(productId);
    if (!product) return { success: false, message: "Product not found" };

    const salePriceKobo = Math.round(salePriceNaira * 100);
    if (salePriceKobo >= product.markupPrice) {
      return { success: false, message: "Sale price must be less than the regular price" };
    }

    const sale = await flashSaleService.create({
      productId,
      label,
      salePrice: salePriceKobo,
      startsAt,
      endsAt,
    });

    revalidateFlashSalePaths();
    return { success: true, message: "Flash sale created", data: sale };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create flash sale";
    return { success: false, message };
  }
}

export async function updateFlashSale(id: string, formData: FormData): Promise<ActionResult> {
  try {
    await requireRole("CRIMSON");

    const existing = await flashSaleService.getById(id);
    if (!existing) return { success: false, message: "Flash sale not found" };

    const label = ((formData.get("label") as string) || "Flash Sale").trim();
    const salePriceNaira = parseFloat((formData.get("salePrice") as string) || "");
    const startsAt = parseDate(formData.get("startsAt"));
    const endsAt = parseDate(formData.get("endsAt"));
    const isActive = formData.get("isActive") === "true";

    if (isNaN(salePriceNaira) || salePriceNaira <= 0) return { success: false, message: "Sale price must be a positive number" };
    if (!startsAt) return { success: false, message: "Start date is required" };
    if (!endsAt) return { success: false, message: "End date is required" };
    if (endsAt <= startsAt) return { success: false, message: "End date must be after start date" };

    const salePriceKobo = Math.round(salePriceNaira * 100);
    if (salePriceKobo >= existing.product.markupPrice) {
      return { success: false, message: "Sale price must be less than the regular price" };
    }

    const sale = await flashSaleService.update(id, {
      label,
      salePrice: salePriceKobo,
      startsAt,
      endsAt,
      isActive,
    });

    revalidateFlashSalePaths();
    return { success: true, message: "Flash sale updated", data: sale };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update flash sale";
    return { success: false, message };
  }
}

export async function toggleFlashSale(id: string, isActive: boolean): Promise<ActionResult> {
  try {
    await requireRole("CRIMSON");
    const sale = await flashSaleService.update(id, { isActive });
    revalidateFlashSalePaths();
    return { success: true, message: isActive ? "Flash sale enabled" : "Flash sale paused", data: sale };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to toggle flash sale";
    return { success: false, message };
  }
}

export async function deleteFlashSale(id: string): Promise<ActionResult> {
  try {
    await requireRole("CRIMSON");
    await flashSaleService.delete(id);
    revalidateFlashSalePaths();
    return { success: true, message: "Flash sale deleted" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete flash sale";
    return { success: false, message };
  }
}
