"use client";

import { useState, useTransition } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { updateSystemSettings } from "@/actions/settings";
import type { SystemSetting } from "@/actions/settings";
import {
  DeliveryRateEditor,
  LAGOS_LGAS,
  NIGERIAN_STATES_EXCL_LAGOS,
} from "@/components/forms/delivery-rate-editor";

interface SettingsFormProps {
  settings: SystemSetting[];
}

const GROUPS: { title: string; description?: string; keys: string[] }[] = [
  {
    title: "Payment Rules",
    keys: [
      "depositPercent",
      "minInstallmentMonths",
      "maxInstallmentMonths",
      "defaultPriceLockDays",
    ],
  },
  {
    title: "Contact & Support",
    keys: ["whatsappNumber", "supportEmail"],
  },
  {
    title: "Store Operations",
    keys: ["storeActive", "announcementBanner"],
  },
  {
    title: "Delivery & Shipping",
    description:
      "Set per-location delivery fees for Lagos LGAs and other states. The default fee is used as a fallback when no matching rate is found. Pickup orders are always free.",
    keys: ["defaultDeliveryFee", "lagosLgaRates", "stateDeliveryRates"],
  },
  {
    title: "Speedaf Logistics",
    description:
      "Enable Speedaf to offer third-party doorstep delivery. Credentials are provided by Speedaf upon account setup.",
    keys: [
      "enableSpeedaf",
      "speedafAppCode",
      "speedafSecretKey",
      "speedafCustomerCode",
      "speedafPlatformSource",
      "speedafSenderName",
      "speedafSenderPhone",
      "speedafSenderAddress",
      "speedafSenderCity",
      "speedafSenderState",
    ],
  },
];

export function SettingsForm({ settings }: SettingsFormProps) {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(settings.map((s) => [s.key, s.value]))
  );
  const [isPending, startTransition] = useTransition();

  function handleChange(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    startTransition(async () => {
      const result = await updateSystemSettings(values);
      if (result.success) {
        toast.success("Settings saved");
      } else {
        toast.error(result.message ?? "Failed to save settings");
      }
    });
  }

  const byKey = Object.fromEntries(settings.map((s) => [s.key, s]));

  return (
    <div className="space-y-8">
      {GROUPS.map((group) => (
        <section
          key={group.title}
          className="rounded-2xl border border-border/60 bg-card p-6 space-y-5"
        >
          <h2 className="text-xs tracking-[0.2em] uppercase text-muted-foreground">
            {group.title}
          </h2>
          {group.description && (
            <p className="text-xs text-muted-foreground -mt-3">
              {group.description}
            </p>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            {group.keys.map((key) => {
              const setting = byKey[key];
              if (!setting) return null;

              return (
                <div
                  key={key}
                  className={`space-y-1.5${setting.type === "json" ? " sm:col-span-2" : ""}`}
                >
                  <Label htmlFor={key}>{setting.label}</Label>

                  {key === "lagosLgaRates" || key === "stateDeliveryRates" ? (
                    <div className="space-y-1">
                      <p className="text-[11px] text-muted-foreground/60">
                        {key === "lagosLgaRates"
                          ? "Applied when the customer selects a Lagos LGA at checkout."
                          : "Applied when the customer's state is outside Lagos."}
                      </p>
                      <DeliveryRateEditor
                        value={values[key] ?? "{}"}
                        onChange={(json) => handleChange(key, json)}
                        options={
                          key === "lagosLgaRates"
                            ? LAGOS_LGAS
                            : NIGERIAN_STATES_EXCL_LAGOS
                        }
                        disabled={isPending}
                      />
                    </div>
                  ) : key === "defaultDeliveryFee" ? (
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        ₦
                      </span>
                      <Input
                        id={key}
                        type="number"
                        value={values[key]}
                        onChange={(e) => handleChange(key, e.target.value)}
                        min={0}
                        disabled={isPending}
                        className="pl-7"
                        placeholder="0"
                      />
                    </div>
                  ) : setting.type === "boolean" ? (
                    <div className="flex items-center gap-3 h-10">
                      <Button
                        id={key}
                        type="button"
                        role="switch"
                        title={setting.label}
                        aria-checked={values[key] === "true"}
                        onClick={() =>
                          handleChange(
                            key,
                            values[key] === "true" ? "false" : "true",
                          )
                        }
                        disabled={isPending}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                          values[key] === "true" ? "bg-primary" : "bg-input"
                        }`}
                      >
                        <span
                          className={`pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${
                            values[key] === "true"
                              ? "translate-x-5"
                              : "translate-x-0"
                          }`}
                        />
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        {values[key] === "true" ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                  ) : setting.type === "json" ? (
                    <textarea
                      id={key}
                      value={values[key]}
                      onChange={(e) => handleChange(key, e.target.value)}
                      disabled={isPending}
                      rows={5}
                      spellCheck={false}
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder='{"LGA or State name": 1500}'
                    />
                  ) : setting.type === "number" ? (
                    <Input
                      id={key}
                      type="number"
                      value={values[key]}
                      onChange={(e) => handleChange(key, e.target.value)}
                      min={0}
                      disabled={isPending}
                    />
                  ) : (
                    <Input
                      id={key}
                      type={
                        key.toLowerCase().includes("email") ? "email" : "text"
                      }
                      value={values[key]}
                      onChange={(e) => handleChange(key, e.target.value)}
                      placeholder={`Enter ${setting.label.toLowerCase()}`}
                      disabled={isPending}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isPending}>
          <Save className="mr-2 h-4 w-4" />
          {isPending ? "Saving…" : "Save All Settings"}
        </Button>
      </div>
    </div>
  );
}
