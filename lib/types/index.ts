// ─── Abstract Roles (ISCE Standard: no hierarchy-revealing names) ──

export enum UserRole {
  CRIMSON = "CRIMSON",   // Platform admin
  AZURE = "AZURE",       // Operations / procurement
  EMERALD = "EMERALD",   // Regular customer
}

// ─── Paystack Types ───────────────────────────────────────────────

export interface PaystackInitResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    status: "success" | "failed" | "abandoned";
    reference: string;
    amount: number; // in kobo
    currency: string;
    channel: string;
    paid_at: string;
    customer: {
      email: string;
      customer_code: string;
    };
    metadata: Record<string, unknown>;
  };
}

export interface PaystackWebhookEvent {
  event: string;
  data: {
    id: number;
    reference: string;
    amount: number;
    currency: string;
    status: string;
    channel: string;
    metadata: Record<string, unknown>;
    customer: {
      email: string;
      customer_code: string;
    };
    paid_at: string;
  };
}

// ─── Server Action Responses ──────────────────────────────────────

export interface ActionResult<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
}

// ─── Order Helpers ────────────────────────────────────────────────

export interface OrderWithProduct {
  id: string;
  totalAmount: number;
  amountPaid: number;
  status: string;
  isDepositPaid: boolean;
  priceLockExpiresAt: Date;
  product: {
    name: string;
    slug: string;
    images: string[];
    markupPrice: number;
  };
}

// ─── Kobo Helpers ─────────────────────────────────────────────────

export const KOBO_MULTIPLIER = 100;

export function nairaToKobo(naira: number): number {
  return Math.round(naira * KOBO_MULTIPLIER);
}

export function koboToNaira(kobo: number): number {
  return kobo / KOBO_MULTIPLIER;
}

export function formatNaira(kobo: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(koboToNaira(kobo));
}
