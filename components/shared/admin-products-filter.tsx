"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

interface AdminProductsFilterProps {
  q: string;
  status: string;
}

const STATUSES = [
  { value: "", label: "All Statuses" },
  { value: "AVAILABLE", label: "Available" },
  { value: "OUT_OF_STOCK", label: "Out of Stock" },
  { value: "DISCONTINUED", label: "Discontinued" },
];

export function AdminProductsFilter({ q, status }: AdminProductsFilterProps) {
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  function update(updates: { q?: string; status?: string }) {
    const newQ = updates.q !== undefined ? updates.q : q;
    const newStatus = updates.status !== undefined ? updates.status : status;
    const params = new URLSearchParams();
    if (newQ.trim()) params.set("q", newQ.trim());
    if (newStatus) params.set("status", newStatus);
    const qs = params.toString();
    router.push(`/admin/products${qs ? `?${qs}` : ""}`);
  }

  function handleSearchChange(value: string) {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => update({ q: value }), 350);
  }

  const hasFilters = !!(q || status);

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3">
      {/* Search — uncontrolled; key forces remount on URL change */}
      <div className="relative min-w-[200px] flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          key={q}
          type="search"
          defaultValue={q}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search products…"
          className="h-10 w-full rounded-lg border border-input bg-background pl-10 pr-4 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {/* Status filter */}
      <select
        key={status}
        aria-label="Filter by status"
        defaultValue={status}
        onChange={(e) => update({ status: e.target.value })}
        className="h-10 appearance-none rounded-lg border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>

      {hasFilters && (
        <button
          onClick={() => update({ q: "", status: "" })}
          className="flex h-10 items-center gap-1.5 rounded-lg border border-border px-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
          Clear
        </button>
      )}
    </div>
  );
}
