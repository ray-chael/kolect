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

export interface ProductCustomFieldOption {
  label: string;
  value: string;
}

export interface ProductCustomField {
  id: string;
  label: string;
  type: "select" | "text";
  required: boolean;
  options: ProductCustomFieldOption[];
}

export type ProductCustomSelections = Record<string, string>;

export type DeliveryMethod = "DELIVERY" | "PICKUP";

export type LogisticsProvider = "INTERNAL" | "SPEEDAF";

export interface PickupLocationSummary {
  id: string;
  name: string;
  city: string;
  state: string;
  addressLine1: string;
  addressLine2?: string | null;
  landmark?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
  pickupInstructions?: string | null;
  logisticsProvider: LogisticsProvider;
}

export function coerceProductCustomFields(
  value: unknown,
): ProductCustomField[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((field) => {
      if (!field || typeof field !== "object") return null;

      const record = field as Record<string, unknown>;
      const options = Array.isArray(record.options)
        ? record.options
            .map((option) => {
              if (!option || typeof option !== "object") return null;
              const optionRecord = option as Record<string, unknown>;
              if (
                typeof optionRecord.label !== "string" ||
                typeof optionRecord.value !== "string"
              ) {
                return null;
              }

              return {
                label: optionRecord.label,
                value: optionRecord.value,
              };
            })
            .filter(
              (option): option is ProductCustomFieldOption => option !== null,
            )
        : [];

      if (
        typeof record.id !== "string" ||
        typeof record.label !== "string" ||
        (record.type !== "select" && record.type !== "text")
      ) {
        return null;
      }

      return {
        id: record.id,
        label: record.label,
        type: record.type,
        required: Boolean(record.required),
        options,
      } satisfies ProductCustomField;
    })
    .filter((field): field is ProductCustomField => field !== null);
}

export function coerceCustomSelections(
  value: unknown,
): ProductCustomSelections {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string",
    ),
  );
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
