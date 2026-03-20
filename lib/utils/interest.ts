import { DEADLINE_OPTIONS } from "@/lib/consts";

/**
 * Get the interest percentage for a given deadline in days.
 * Matches the closest tier that is >= the requested days.
 */
export function getInterestPercent(deadlineDays: number): number {
  // Find the matching tier (exact match or next higher)
  for (const tier of DEADLINE_OPTIONS) {
    if (deadlineDays <= tier.days) return tier.interestPercent;
  }
  // If beyond all tiers, use the highest
  return DEADLINE_OPTIONS[DEADLINE_OPTIONS.length - 1].interestPercent;
}

/**
 * Calculate interest for a group buy or help-me-pay campaign.
 */
export function calculateInterest(
  baseAmountKobo: number,
  deadlineDays: number,
) {
  const interestPercent = getInterestPercent(deadlineDays);
  const interestAmount = Math.round(baseAmountKobo * (interestPercent / 100));
  return {
    interestPercent,
    interestAmount,
    totalAmount: baseAmountKobo + interestAmount,
  };
}

/**
 * Get deadline Date from a number of days from now.
 */
export function deadlineFromDays(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}
