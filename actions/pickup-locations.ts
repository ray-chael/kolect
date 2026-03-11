"use server";

import { requireRole } from "@/lib/session";
import {
  createPickupLocationSchema,
  updatePickupLocationSchema,
} from "@/lib/schemas";
import { pickupLocationService } from "@/lib/services/pickup-location.service";
import { generateSlug } from "@/lib/utils";
import type { ActionResult } from "@/lib/types";

function normalizeOptional(value: FormDataEntryValue | null) {
  const parsed = typeof value === "string" ? value.trim() : "";
  return parsed || undefined;
}

export async function createPickupLocation(
  formData: FormData,
): Promise<ActionResult> {
  try {
    await requireRole("CRIMSON");

    const rawData = {
      name: formData.get("name") as string,
      description: normalizeOptional(formData.get("description")),
      addressLine1: formData.get("addressLine1") as string,
      addressLine2: normalizeOptional(formData.get("addressLine2")),
      city: formData.get("city") as string,
      state: formData.get("state") as string,
      landmark: normalizeOptional(formData.get("landmark")),
      contactName: normalizeOptional(formData.get("contactName")),
      contactPhone: normalizeOptional(formData.get("contactPhone")),
      pickupInstructions: normalizeOptional(formData.get("pickupInstructions")),
      logisticsProvider:
        (formData.get("logisticsProvider") as "INTERNAL" | "SPEEDAF") || "INTERNAL",
      externalReference: normalizeOptional(formData.get("externalReference")),
      isActive: formData.get("isActive") === "true",
    };

    const parsed = createPickupLocationSchema.safeParse(rawData);
    if (!parsed.success) {
      return {
        success: false,
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const location = await pickupLocationService.create({
      ...parsed.data,
      slug: generateSlug(parsed.data.name),
    });

    return { success: true, message: "Pickup location created", data: location };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to create pickup location",
    };
  }
}

export async function updatePickupLocation(
  locationId: string,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await requireRole("CRIMSON");

    const rawData = {
      name: formData.get("name") as string,
      description: normalizeOptional(formData.get("description")),
      addressLine1: formData.get("addressLine1") as string,
      addressLine2: normalizeOptional(formData.get("addressLine2")) ?? null,
      city: formData.get("city") as string,
      state: formData.get("state") as string,
      landmark: normalizeOptional(formData.get("landmark")) ?? null,
      contactName: normalizeOptional(formData.get("contactName")) ?? null,
      contactPhone: normalizeOptional(formData.get("contactPhone")) ?? null,
      pickupInstructions: normalizeOptional(formData.get("pickupInstructions")) ?? null,
      logisticsProvider:
        (formData.get("logisticsProvider") as "INTERNAL" | "SPEEDAF") || "INTERNAL",
      externalReference: normalizeOptional(formData.get("externalReference")) ?? null,
      isActive: formData.get("isActive") === "true",
    };

    const parsed = updatePickupLocationSchema.safeParse({
      ...rawData,
      slug: generateSlug(rawData.name),
    });
    if (!parsed.success) {
      return {
        success: false,
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const location = await pickupLocationService.update(locationId, parsed.data);
    return { success: true, message: "Pickup location updated", data: location };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to update pickup location",
    };
  }
}

export async function deletePickupLocation(
  locationId: string,
): Promise<ActionResult> {
  try {
    await requireRole("CRIMSON");
    await pickupLocationService.delete(locationId);
    return { success: true, message: "Pickup location deleted" };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to delete pickup location",
    };
  }
}