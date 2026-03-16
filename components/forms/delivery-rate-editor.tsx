"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const LAGOS_LGAS = [
  "Agege",
  "Ajeromi-Ifelodun",
  "Alimosho",
  "Amuwo-Odofin",
  "Apapa",
  "Badagry",
  "Epe",
  "Eti-Osa",
  "Ibeju-Lekki",
  "Ifako-Ijaiye",
  "Ikeja",
  "Ikorodu",
  "Kosofe",
  "Lagos Island",
  "Lagos Mainland",
  "Mushin",
  "Ojo",
  "Oshodi-Isolo",
  "Shomolu",
  "Surulere",
];

export const NIGERIAN_STATES_EXCL_LAGOS = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "FCT",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
];

interface RateRow {
  id: string;
  location: string;
  fee: string;
}

function parseToRows(json: string): RateRow[] {
  try {
    const obj = JSON.parse(json);
    if (obj && typeof obj === "object" && !Array.isArray(obj)) {
      return Object.entries(obj).map(([location, fee], i) => ({
        id: `init-${i}-${location}`,
        location,
        fee: String(fee),
      }));
    }
  } catch {}
  return [];
}

function rowsToJson(rows: RateRow[]): string {
  const obj: Record<string, number> = {};
  for (const { location, fee } of rows) {
    const key = location.trim();
    if (key) obj[key] = Number(fee) || 0;
  }
  return JSON.stringify(obj, null, 2);
}

interface DeliveryRateEditorProps {
  value: string;
  onChange: (json: string) => void;
  /** When provided, location column renders a dropdown instead of a free-text input. */
  options?: string[];
  placeholder?: string;
  disabled?: boolean;
}

export function DeliveryRateEditor({
  value,
  onChange,
  options,
  placeholder = "Location name",
  disabled,
}: DeliveryRateEditorProps) {
  const [rows, setRows] = useState<RateRow[]>(() => parseToRows(value));
  const isFirstRender = useRef(true);
  const allOptionsUsed = options !== undefined && rows.length >= options.length;

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    onChange(rowsToJson(rows));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

  function addRow() {
    setRows((prev) => [
      ...prev,
      { id: crypto.randomUUID(), location: "", fee: "" },
    ]);
  }

  function updateRow(id: string, field: "location" | "fee", val: string) {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: val } : r)),
    );
  }

  function removeRow(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <div className="space-y-2">
      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/50 bg-muted/20 py-7 text-center">
          <MapPin className="mb-2 h-5 w-5 text-muted-foreground/30" />
          <p className="text-xs font-medium text-muted-foreground">
            No rates configured
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground/50">
            Click &ldquo;Add rate&rdquo; to set location-based fees
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          <div className="grid grid-cols-[1fr_8rem_2.25rem] gap-2 px-1 pb-0.5">
            <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/50">
              Location
            </span>
            <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/50">
              Fee (₦)
            </span>
            <span />
          </div>

          {rows.map((row) => (
            <div
              key={row.id}
              className="group grid grid-cols-[1fr_8rem_2.25rem] items-center gap-2 rounded-lg border border-border/40 bg-muted/20 px-2.5 py-2 transition-colors hover:border-border/70 hover:bg-muted/30"
            >
              <div className="flex items-center gap-2">
                <MapPin className="h-3 w-3 shrink-0 text-muted-foreground/40" />
                {options ? (
                  <select
                    value={row.location}
                    onChange={(e) =>
                      updateRow(row.id, "location", e.target.value)
                    }
                    disabled={disabled}
                    title="Select location"
                    className="h-8 flex-1 border-0 bg-transparent text-sm outline-none focus:ring-0 cursor-pointer text-foreground disabled:cursor-not-allowed disabled:opacity-50 [&>option]:bg-popover [&>option]:text-popover-foreground"
                  >
                    <option value="" disabled>
                      Select location…
                    </option>
                    {options
                      .filter(
                        (opt) =>
                          opt === row.location ||
                          !rows.some(
                            (r) => r.id !== row.id && r.location === opt,
                          ),
                      )
                      .map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                  </select>
                ) : (
                  <Input
                    value={row.location}
                    onChange={(e) =>
                      updateRow(row.id, "location", e.target.value)
                    }
                    placeholder={placeholder}
                    disabled={disabled}
                    className="h-8 border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/40"
                  />
                )}
              </div>
              <div className="relative">
                <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/60">
                  ₦
                </span>
                <Input
                  type="number"
                  value={row.fee}
                  onChange={(e) => updateRow(row.id, "fee", e.target.value)}
                  placeholder="0"
                  disabled={disabled}
                  min={0}
                  className="h-8 pl-6 text-sm"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeRow(row.id)}
                disabled={disabled}
                className="h-7 w-7 text-muted-foreground/40 opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                title="Remove rate"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addRow}
        disabled={disabled || allOptionsUsed}
        className="h-8 gap-1.5 border-dashed text-xs text-muted-foreground hover:text-foreground"
      >
        <Plus className="h-3.5 w-3.5" />
        Add rate
      </Button>
    </div>
  );
}
