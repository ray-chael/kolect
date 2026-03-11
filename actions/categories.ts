"use server";

import { requireRole } from "@/lib/session";
import { categoryService } from "@/lib/services/category.service";
import { createCategorySchema, updateCategorySchema } from "@/lib/schemas";
import { generateSlug } from "@/lib/utils";
import type { ActionResult } from "@/lib/types";

export async function createCategory(
  formData: FormData
): Promise<ActionResult> {
  try {
    await requireRole("CRIMSON");

    const rawData = {
      name: formData.get("name") as string,
      parentId: (formData.get("parentId") as string) || undefined,
    };

    const parsed = createCategorySchema.safeParse(rawData);
    if (!parsed.success) {
      return {
        success: false,
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const slug = generateSlug(parsed.data.name);
    const category = await categoryService.create({
      ...parsed.data,
      slug,
    });

    return { success: true, message: "Category created", data: category };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to create category",
    };
  }
}

export async function updateCategory(
  categoryId: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    await requireRole("CRIMSON");

    const rawData: Record<string, unknown> = {};
    const name = formData.get("name") as string;
    if (name) {
      rawData.name = name;
      rawData.slug = generateSlug(name);
    }
    const parentId = formData.get("parentId") as string;
    rawData.parentId = parentId || null;

    const parsed = updateCategorySchema.safeParse(rawData);
    if (!parsed.success) {
      return {
        success: false,
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const category = await categoryService.update(categoryId, rawData as { name?: string; slug?: string; parentId?: string | null });
    return { success: true, message: "Category updated", data: category };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to update category",
    };
  }
}

export async function deleteCategory(
  categoryId: string
): Promise<ActionResult> {
  try {
    await requireRole("CRIMSON");
    await categoryService.delete(categoryId);
    return { success: true, message: "Category deleted" };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to delete category",
    };
  }
}

export async function getCategories(): Promise<ActionResult> {
  try {
    const categories = await categoryService.getAll();
    return { success: true, message: "Categories retrieved", data: categories };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to fetch categories",
    };
  }
}

export async function getCategoriesFlat(): Promise<ActionResult> {
  try {
    const categories = await categoryService.getAllFlat();
    return { success: true, message: "Categories retrieved", data: categories };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to fetch categories",
    };
  }
}
