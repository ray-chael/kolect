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

// ─── Paystack Webhook IPs (for IP whitelisting) ──────────────────

export const PAYSTACK_WEBHOOK_IPS = [
  "52.31.139.75",
  "52.49.173.169",
  "52.214.14.220",
] as const;
