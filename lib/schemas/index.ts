import { z } from "zod/v4";

// ─── Product Schemas ──────────────────────────────────────────

export const createProductSchema = z.object({
  name: z.string().min(2, "Product name must be at least 2 characters"),
  description: z.string().optional(),
  images: z.array(z.string().url()).default([]),
  originalCost: z.number().int().positive("Original cost must be positive"),
  markupPrice: z.number().int().positive("Markup price must be positive"),
  moq: z.number().int().min(1).default(1),
  isPreorder: z.boolean().default(false),
  expectedProcurementAt: z.coerce.date().optional(),
  priceLockDays: z.number().int().min(1).max(180).default(60),
  category: z.string().optional(),
});

export const updateProductSchema = createProductSchema.partial();

// ─── Order Schemas ────────────────────────────────────────────

export const createOrderSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  quantity: z.number().int().min(1).default(1),
  addressId: z.string().optional(),
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
  amount: z
    .number()
    .int()
    .min(200_000, "Minimum payment is ₦2,000"), // 2000 naira in kobo
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
