"use server";

import {
    speedafService,
    buildSpeedafCredentials,
} from "@/lib/services/speedaf.service";
import { getSystemSettings } from "@/actions/settings";
import type { ActionResult } from "@/lib/types";

/**
 * Fetch a Speedaf shipping tariff for a given Nigerian state and parcel weight.
 * Uses the sender state from system settings (defaults to "Lagos").
 */
export async function getSpeedafQuote(
  receiverState: string,
  weightKg: number,
): Promise<ActionResult<{ fee: number; currency: string }>> {
  try {
    const settings = await getSystemSettings();
    const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));

    const creds = buildSpeedafCredentials(map);
    const senderState = map.speedafSenderState?.trim() || "Lagos";

    // Fetch all Nigerian provinces/states from Speedaf
    const provinces = await speedafService.getAreas(creds, { type: 1 });

    function findProvince(name: string) {
      const lower = name.toLowerCase();
      return (
        provinces.find((p) => p.name.toLowerCase() === lower) ??
        provinces.find((p) => p.name.toLowerCase().includes(lower)) ??
        provinces.find((p) => lower.includes(p.name.toLowerCase()))
      );
    }

    const senderProv = findProvince(senderState);
    const receiverProv = findProvince(receiverState);

    if (!senderProv) {
      return {
        success: false,
        message: `Sender region "${senderState}" not found in Speedaf system`,
      };
    }
    if (!receiverProv) {
      return {
        success: false,
        message: `Speedaf delivery to "${receiverState}" is not available`,
      };
    }

    // Fetch city codes for both provinces in parallel
    const [senderCities, receiverCities] = await Promise.all([
      speedafService.getAreas(creds, { type: 2, parentCode: senderProv.code }),
      speedafService.getAreas(creds, {
        type: 2,
        parentCode: receiverProv.code,
      }),
    ]);

    const senderCity = senderCities[0];
    const receiverCity = receiverCities[0];

    if (!senderCity || !receiverCity) {
      return {
        success: false,
        message: "Could not resolve city codes for this route",
      };
    }

    const tariff = await speedafService.getTariff(creds, {
      senderProvinceCode: senderProv.code,
      senderCityCode: senderCity.code,
      receiverProvinceCode: receiverProv.code,
      receiverCityCode: receiverCity.code,
      parcelWeight: Math.max(weightKg, 0.1),
    });

    return {
      success: true,
      message: "Quote retrieved",
      data: {
        fee: tariff.freight,
        currency: tariff.currencyCode || "NGN",
      },
    };
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : "Failed to get Speedaf quote";
    return { success: false, message: msg };
  }
}
