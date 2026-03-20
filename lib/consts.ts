// ─── Application Constants ────────────────────────────────────────

export const APP_NAME = "Ade's Kolekt";

// ─── Business Rules ───────────────────────────────────────────────

/** Minimum installment payment in kobo (₦2,000) */
export const MIN_INSTALLMENT_KOBO = 200_000;

/** Non-refundable deposit percentage (20%) */
export const DEPOSIT_PERCENTAGE = 0.2;

/** Default price lock duration in days */
export const DEFAULT_PRICE_LOCK_DAYS = 60;

/** Days before price lock expiry to send warning */
export const PRICE_LOCK_WARNING_DAYS = 7;

// ─── API Endpoints ────────────────────────────────────────────────

export const PAYSTACK_BASE_URL = "https://api.paystack.co";

export const PAYSTACK_ENDPOINTS = {
  INITIALIZE: `${PAYSTACK_BASE_URL}/transaction/initialize`,
  VERIFY: (reference: string) =>
    `${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`,
  DEDICATED_ACCOUNT: `${PAYSTACK_BASE_URL}/dedicated_account`,
} as const;

// ─── Group Buy / Help Me Pay ──────────────────────────────────────

/** Minimum helper contribution in kobo (₦1,000) */
export const MIN_HELPER_CONTRIBUTION_KOBO = 100_000;

/** Deadline options for group buy and help me pay campaigns */
export const DEADLINE_OPTIONS = [
  { days: 7, label: "1 week", interestPercent: 0 },
  { days: 14, label: "2 weeks", interestPercent: 2 },
  { days: 30, label: "1 month", interestPercent: 5 },
  { days: 60, label: "2 months", interestPercent: 10 },
  { days: 90, label: "3 months", interestPercent: 15 },
] as const;

// ─── Paystack Webhook IPs (for IP whitelisting) ──────────────────

export const PAYSTACK_WEBHOOK_IPS = [
  "52.31.139.75",
  "52.49.173.169",
  "52.214.14.220",
] as const;
