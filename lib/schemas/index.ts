import { z } from "zod/v4";

const productCustomFieldOptionSchema = z.object({
  label: z.string().min(1, "Option label is required"),
  value: z.string().min(1, "Option value is required"),
});

const productCustomFieldSchema = z
  .object({
    id: z.string().min(1, "Field id is required"),
    label: z.string().min(1, "Field label is required"),
    type: z.enum(["select", "text"]),
    required: z.boolean().default(false),
    options: z.array(productCustomFieldOptionSchema).default([]),
  })
  .superRefine((field, ctx) => {
    if (field.type === "select" && field.options.length === 0) {
      ctx.addIssue({
        code: "custom",
        message: "Select fields must include at least one option",
        path: ["options"],
      });
    }
  });

// ─── Category Schemas ─────────────────────────────────────────

export const createCategorySchema = z.object({
  name: z.string().min(2, "Category name must be at least 2 characters"),
  parentId: z.string().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

// ─── Product Schemas ──────────────────────────────────────────

export const createProductSchema = z.object({
  name: z.string().min(2, "Product name must be at least 2 characters"),
  description: z.string().optional(),
  images: z.array(z.string().url()).default([]),
  videos: z
    .array(z.string().url())
    .max(2, "Maximum 2 videos allowed")
    .default([]),
  colors: z.array(z.string().min(1)).default([]),
  sizes: z.array(z.string().min(1)).default([]),
  customFields: z.array(productCustomFieldSchema).default([]),
  originalCost: z.number().int().positive("Original cost must be positive"),
  markupPrice: z.number().int().positive("Markup price must be positive"),
  moq: z.number().int().min(1).default(1),
  isPreorder: z.boolean().default(false),
  expectedProcurementAt: z.coerce.date().optional(),
  priceLockDays: z.number().int().min(1).max(180).default(60),
  categoryId: z.string().nullable().optional(),
});

export const updateProductSchema = createProductSchema.partial();

// ─── Order Schemas ────────────────────────────────────────────

export const createOrderSchema = z
  .object({
    productId: z.string().min(1, "Product is required"),
    quantity: z.number().int().min(1).default(1),
    termsAccepted: z.boolean().default(false),
    addressId: z.string().optional(),
    deliveryMethod: z.enum(["DELIVERY", "PICKUP"]).default("DELIVERY"),
    pickupLocationId: z.string().optional(),
    recipientName: z.string().optional(),
    phone: z.string().optional(),
    addressLine1: z.string().optional(),
    addressLine2: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    purchaseMode: z.enum(["buy-now", "contribute"]).default("contribute"),
    installmentMonths: z.number().int().min(1).max(3).default(3),
    contributionCadence: z.enum(["daily", "weekly", "monthly"]).optional(),
    contributionDuration: z.number().int().min(1).optional(),
    selectedColor: z.string().optional(),
    selectedSize: z.string().optional(),
    customSelections: z.record(z.string(), z.string()).default({}),
  })
  .superRefine((data, ctx) => {
    if (!data.termsAccepted) {
      ctx.addIssue({
        code: "custom",
        message: "You must agree to the terms and conditions before continuing",
        path: ["termsAccepted"],
      });
    }

    if (data.deliveryMethod === "DELIVERY") {
      if (!data.recipientName?.trim()) {
        ctx.addIssue({
          code: "custom",
          message: "Recipient name is required",
          path: ["recipientName"],
        });
      }

      if (!data.phone?.trim()) {
        ctx.addIssue({
          code: "custom",
          message: "Phone is required",
          path: ["phone"],
        });
      }

      if (!data.addressLine1?.trim()) {
        ctx.addIssue({
          code: "custom",
          message: "Address is required",
          path: ["addressLine1"],
        });
      }

      if (!data.city?.trim()) {
        ctx.addIssue({
          code: "custom",
          message: "City is required",
          path: ["city"],
        });
      }

      if (!data.state?.trim()) {
        ctx.addIssue({
          code: "custom",
          message: "State is required",
          path: ["state"],
        });
      }
    }

    if (data.deliveryMethod === "PICKUP" && !data.pickupLocationId) {
      ctx.addIssue({
        code: "custom",
        message: "Pickup location is required",
        path: ["pickupLocationId"],
      });
    }

    if (data.purchaseMode === "contribute") {
      if (!data.contributionCadence) {
        ctx.addIssue({
          code: "custom",
          message: "Contribution cadence is required",
          path: ["contributionCadence"],
        });
      }

      if (!data.contributionDuration) {
        ctx.addIssue({
          code: "custom",
          message: "Contribution duration is required",
          path: ["contributionDuration"],
        });
      }
    }
  });

export const updateOrderStatusSchema = z.object({
  orderId: z.string().min(1),
  status: z.enum([
    "PENDING",
    "PARTIAL",
    "PAID",
    "PROCURED",
    "DISPATCHED",
    "DELIVERED",
    "CANCELLED",
    "EXPIRED",
  ]),
  riderName: z.string().optional(),
  riderPhone: z.string().optional(),
  trackingNote: z.string().optional(),
});

// ─── Payment Schemas ──────────────────────────────────────────

export const initiatePaymentSchema = z.object({
  orderId: z.string().min(1, "Order is required"),
  amount: z.number().int().min(200_000, "Minimum payment is ₦2,000"), // 2000 naira in kobo
});

// ─── Address Schemas ──────────────────────────────────────────

export const createAddressSchema = z.object({
  label: z.string().default("Home"),
  recipientName: z.string().min(2, "Recipient name is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  addressLine1: z.string().min(5, "Address is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  isDefault: z.boolean().default(false),
});

export const updateAddressSchema = createAddressSchema.partial();

export const createPickupLocationSchema = z.object({
  name: z.string().min(2, "Location name must be at least 2 characters"),
  description: z.string().optional(),
  addressLine1: z.string().min(5, "Address is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  landmark: z.string().optional(),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  pickupInstructions: z.string().optional(),
  logisticsProvider: z.enum(["INTERNAL", "SPEEDAF"]).default("INTERNAL"),
  externalReference: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const updatePickupLocationSchema = createPickupLocationSchema.partial();

// ─── Auth Schemas ─────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.email("Valid email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.email("Valid email is required"),
  phone: z
    .string()
    .min(10, "Valid phone number is required")
    .optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
