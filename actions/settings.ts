"use server";

import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/db";
import type { ActionResult } from "@/lib/types";

// ─── Default settings definition ─────────────────────────────

export interface SystemSetting {
  key: string;
  value: string;
  type: "string" | "number" | "boolean";
  label: string;
}

const DEFAULTS: SystemSetting[] = [
  { key: "depositPercent",        value: "30",    type: "number",  label: "Deposit Percentage (%)" },
  { key: "minInstallmentMonths",  value: "1",     type: "number",  label: "Min Installment Months" },
  { key: "maxInstallmentMonths",  value: "12",    type: "number",  label: "Max Installment Months" },
  { key: "defaultPriceLockDays",  value: "60",    type: "number",  label: "Default Price Lock Days" },
  { key: "whatsappNumber",        value: "",      type: "string",  label: "WhatsApp Support Number" },
  { key: "supportEmail",          value: "",      type: "string",  label: "Support Email Address" },
  { key: "storeActive",           value: "true",  type: "boolean", label: "Store Active (accept orders)" },
  { key: "announcementBanner",    value: "",      type: "string",  label: "Announcement Banner Text" },
];

// ─── Public read (server components can call this) ────────────

export async function getSystemSettings(): Promise<SystemSetting[]> {
  try {
    const rows = await prisma.systemSetting.findMany();
    const map = new Map(rows.map((r) => [r.key, r.value]));

    return DEFAULTS.map((d) => ({
      ...d,
      value: map.has(d.key) ? (map.get(d.key) as string) : d.value,
    }));
  } catch {
    return DEFAULTS;
  }
}

export async function getSettingValue(key: string): Promise<string> {
  try {
    const row = await prisma.systemSetting.findUnique({ where: { key } });
    if (row) return row.value;
  } catch {
    // table may not exist yet
  }
  return DEFAULTS.find((d) => d.key === key)?.value ?? "";
}

// ─── Admin write ──────────────────────────────────────────────

export async function updateSystemSettings(
  updates: Record<string, string>
): Promise<ActionResult> {
  try {
    await requireRole("CRIMSON");

    const ops = Object.entries(updates)
      .filter(([key]) => DEFAULTS.some((d) => d.key === key))
      .map(([key, value]) => {
        const def = DEFAULTS.find((d) => d.key === key)!;
        return prisma.systemSetting.upsert({
          where: { key },
          update: { value },
          create: { key, value, type: def.type, label: def.label },
        });
      });

    if (ops.length > 0) await prisma.$transaction(ops);

    return { success: true, message: "" };
  } catch (e) {
    console.error("[updateSystemSettings]", e);
    return { success: false, message: "Failed to save settings" };
  }
}
