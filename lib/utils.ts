import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { DEPOSIT_PERCENTAGE } from "@/lib/consts";

export type ContributionCadence = "daily" | "weekly" | "monthly";

const CONTRIBUTION_LIMITS: Record<
  ContributionCadence,
  {
    min: number;
    max: number;
    step: number;
    unit: string;
    intervalLabel: string;
  }
> = {
  daily: { min: 7, max: 90, step: 1, unit: "days", intervalLabel: "day" },
  weekly: { min: 1, max: 12, step: 1, unit: "weeks", intervalLabel: "week" },
  monthly: { min: 1, max: 3, step: 1, unit: "months", intervalLabel: "month" },
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getContributionDurationLimits(cadence: ContributionCadence) {
  return CONTRIBUTION_LIMITS[cadence];
}

export function clampContributionDuration(
  cadence: ContributionCadence,
  duration: number,
): number {
  const limits = getContributionDurationLimits(cadence);
  const normalized = Number.isFinite(duration)
    ? Math.round(duration)
    : limits.min;
  return Math.min(limits.max, Math.max(limits.min, normalized));
}

export function contributionDurationToDays(
  cadence: ContributionCadence,
  duration: number,
): number {
  const safeDuration = clampContributionDuration(cadence, duration);

  switch (cadence) {
    case "daily":
      return safeDuration;
    case "weekly":
      return safeDuration * 7;
    case "monthly":
      return safeDuration * 30;
  }
}

export function contributionDurationToMonths(
  cadence: ContributionCadence,
  duration: number,
): number {
  return Math.max(
    1,
    Math.ceil(contributionDurationToDays(cadence, duration) / 30),
  );
}

export function formatContributionDuration(
  cadence: ContributionCadence,
  duration: number,
): string {
  const safeDuration = clampContributionDuration(cadence, duration);
  const { unit } = getContributionDurationLimits(cadence);
  const singularUnit = safeDuration === 1 ? unit.slice(0, -1) : unit;

  return `${safeDuration} ${singularUnit}`;
}

export function calculateContributionPlan({
  totalPrice,
  cadence,
  duration,
}: {
  totalPrice: number;
  cadence: ContributionCadence;
  duration: number;
}) {
  const safeDuration = clampContributionDuration(cadence, duration);
  const days = contributionDurationToDays(cadence, safeDuration);
  const installmentMonths = contributionDurationToMonths(cadence, safeDuration);
  const surchargeRate = Math.min(0.15, (days / 30) * 0.05);
  const surchargeAmount = Math.round(totalPrice * surchargeRate);
  const adjustedTotal = totalPrice + surchargeAmount;
  const depositAmount = calculateDeposit(adjustedTotal);
  const remainingBalance = adjustedTotal - depositAmount;
  const installmentCount = safeDuration;
  const installmentAmount = Math.ceil(remainingBalance / installmentCount);
  const intervalLabel = getContributionDurationLimits(cadence).intervalLabel;
  const singularLabel =
    installmentCount === 1 ? intervalLabel : `${intervalLabel}s`;

  return {
    cadence,
    duration: safeDuration,
    days,
    installmentMonths,
    surchargeRate,
    surchargeAmount,
    adjustedTotal,
    depositAmount,
    remainingBalance,
    installmentCount,
    installmentAmount,
    intervalLabel,
    durationLabel: formatContributionDuration(cadence, safeDuration),
    paymentLabel: `${installmentCount} ${singularLabel}`,
  };
}

/** Calculate deposit amount in kobo (20% of total) */
export function calculateDeposit(totalKobo: number): number {
  return Math.round(totalKobo * DEPOSIT_PERCENTAGE);
}

/** Calculate liquidation percentage (0-100) */
export function calculateLiquidationPercent(
  paidKobo: number,
  totalKobo: number,
): number {
  if (totalKobo <= 0) return 0;
  return Math.min(100, Math.round((paidKobo / totalKobo) * 100));
}

/** Calculate days until price lock expiry */
export function daysUntilExpiry(expiresAt: Date | null): number {
  if (!expiresAt) return 0;
  const now = new Date();
  const diff = new Date(expiresAt).getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

/** Generate a URL-safe slug from text */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
