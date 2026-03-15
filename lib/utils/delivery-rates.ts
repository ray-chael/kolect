/**
 * Delivery fee computation utilities.
 *
 * Rates are stored in Naira (human-readable in admin UI).
 * All computed results are returned in kobo (× 100).
 *
 * Rules:
 *  - state === "Lagos" → look up lagosLgaRates[lga] → fallback to defaultFeeNaira
 *  - any other state  → look up stateRates[state]  → fallback to defaultFeeNaira
 */

export interface DeliveryRates {
  /** Lagos LGA display name → naira fee, e.g. { "Ikeja": 1500, "Eti Osa": 2000 } */
  lagos: Record<string, number>;
  /** State display name → naira fee, e.g. { "Ogun": 2000, "Kano": 4000 } */
  states: Record<string, number>;
  /** Fallback fee in naira when no specific rate is configured */
  defaultFeeNaira: number;
}

export function computeDeliveryFeeKobo(
  state: string,
  lga: string,
  rates: DeliveryRates,
): number {
  let naira: number;
  if (state === "Lagos") {
    naira = rates.lagos[lga] ?? rates.defaultFeeNaira;
  } else {
    naira = rates.states[state] ?? rates.defaultFeeNaira;
  }
  return Math.round(naira * 100);
}

/** Parse raw JSON setting strings into a DeliveryRates struct. */
export function parseDeliveryRates(
  lagosLgaRatesJson: string,
  stateDeliveryRatesJson: string,
  defaultFeeNaira: number,
): DeliveryRates {
  let lagos: Record<string, number> = {};
  let states: Record<string, number> = {};

  try {
    const parsed: unknown = JSON.parse(lagosLgaRatesJson);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      lagos = parsed as Record<string, number>;
    }
  } catch {
    // invalid JSON — empty map, default fee applies
  }

  try {
    const parsed: unknown = JSON.parse(stateDeliveryRatesJson);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      states = parsed as Record<string, number>;
    }
  } catch {
    // invalid JSON — empty map, default fee applies
  }

  return { lagos, states, defaultFeeNaira };
}
