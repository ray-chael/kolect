"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, X, ChevronLeft, ChevronRight } from "lucide-react";

interface AdminOrdersFilterProps {
  q: string;
  status: string;
  page: number;
  totalPages: number;
}

const STATUSES = [
  { value: "", label: "All Statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "PARTIAL", label: "Partial" },
  { value: "PAID", label: "Paid" },
  { value: "PROCURED", label: "Procured" },
  { value: "DISPATCHED", label: "Dispatched" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "EXPIRED", label: "Expired" },
];

export function AdminOrdersFilter({
  q,
  status,
  page,
  totalPages,
}: AdminOrdersFilterProps) {
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  function update(updates: { q?: string; status?: string; page?: number }) {
    const newQ = updates.q !== undefined ? updates.q : q;
    const newStatus = updates.status !== undefined ? updates.status : status;
    const newPage = updates.page !== undefined ? updates.page : page;
    const params = new URLSearchParams();
    if (newQ.trim()) params.set("q", newQ.trim());
    if (newStatus) params.set("status", newStatus);
    if (newPage > 1) params.set("page", String(newPage));
    const qs = params.toString();
    router.push(`/admin/orders${qs ? `?${qs}` : ""}`);
  }

  function handleSearchChange(value: string) {
    clearTimeout(timer.current);
    // Reset to page 1 on new search
    timer.current = setTimeout(() => update({ q: value, page: 1 }), 350);
  }

  const hasFilters = !!(q || status);

  return (
    <div className="mb-6 space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            key={q}
            type="search"
            defaultValue={q}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search by customer or product…"
            className="h-10 w-full rounded-lg border border-input bg-background pl-10 pr-4 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        {/* Status filter */}
        <select
          key={status}
          aria-label="Filter by order status"
          defaultValue={status}
          onChange={(e) => update({ status: e.target.value, page: 1 })}
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
            onClick={() => update({ q: "", status: "", page: 1 })}
            className="flex h-10 items-center gap-1.5 rounded-lg border border-border px-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </button>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          <button
            aria-label="Previous page"
            onClick={() => update({ page: page - 1 })}
            disabled={page <= 1}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm text-muted-foreground tabular-nums">
            Page {page} of {totalPages}
          </span>
          <button
            aria-label="Next page"
            onClick={() => update({ page: page + 1 })}
            disabled={page >= totalPages}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
