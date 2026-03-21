"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface WebhookLogRow {
  id: string;
  source: string;
  event: string;
  reference: string | null;
  payload: unknown;
  createdAt: string;
}

interface Props {
  logs: WebhookLogRow[];
  total: number;
  page: number;
  totalPages: number;
  currentSource: string;
  sourceCounts: { source: string; count: number }[];
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
    hour12: false,
  }).format(new Date(iso));
}

function sourceLabel(source: string) {
  const map: Record<string, string> = {
    paystack: "Paystack",
    resend: "Resend",
  };
  return map[source] ?? source;
}

function sourceBadgeClass(source: string) {
  const map: Record<string, string> = {
    paystack: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
    resend: "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300",
  };
  return map[source] ?? "bg-muted text-muted-foreground";
}

export function WebhooksClient({
  logs,
  total,
  page,
  totalPages,
  currentSource,
  sourceCounts,
}: Props) {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function setSource(s: string) {
    const params = new URLSearchParams();
    if (s !== "all") params.set("source", s);
    params.set("page", "1");
    router.push(`/admin/webhooks?${params.toString()}`);
  }

  function setPage(p: number) {
    const params = new URLSearchParams();
    if (currentSource !== "all") params.set("source", currentSource);
    params.set("page", String(p));
    router.push(`/admin/webhooks?${params.toString()}`);
  }

  const filterTabs = [
    { key: "all", label: "All", count: total },
    ...sourceCounts.map((s) => ({
      key: s.source,
      label: sourceLabel(s.source),
      count: s.count,
    })),
  ];

  return (
    <div className="mt-8 space-y-6">
      {/* Source filter tabs */}
      <div className="flex flex-wrap gap-2">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setSource(tab.key)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              currentSource === tab.key
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
            }`}
          >
            {tab.label}
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                currentSource === tab.key
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-background/60"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      {logs.length === 0 ? (
        <div className="rounded-2xl border border-border/60 bg-muted/20 px-6 py-16 text-center">
          <p className="text-muted-foreground text-sm">No webhook events yet.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border/60 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30">
                <th className="px-4 py-3 text-left text-xs tracking-[0.12em] uppercase text-muted-foreground font-medium">
                  Source
                </th>
                <th className="px-4 py-3 text-left text-xs tracking-[0.12em] uppercase text-muted-foreground font-medium">
                  Event
                </th>
                <th className="hidden md:table-cell px-4 py-3 text-left text-xs tracking-[0.12em] uppercase text-muted-foreground font-medium">
                  Reference
                </th>
                <th className="px-4 py-3 text-right text-xs tracking-[0.12em] uppercase text-muted-foreground font-medium">
                  Time
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {logs.map((log) => (
                <>
                  <tr
                    key={log.id}
                    onClick={() =>
                      setExpandedId(expandedId === log.id ? null : log.id)
                    }
                    className="cursor-pointer hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${sourceBadgeClass(log.source)}`}
                      >
                        {sourceLabel(log.source)}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-foreground/80">
                      {log.event}
                    </td>
                    <td className="hidden md:table-cell px-4 py-3 font-mono text-xs text-muted-foreground">
                      {log.reference ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(log.createdAt)}
                    </td>
                  </tr>
                  {expandedId === log.id && (
                    <tr key={`${log.id}-payload`}>
                      <td colSpan={4} className="bg-muted/20 px-4 py-4">
                        <pre className="overflow-x-auto whitespace-pre-wrap break-all rounded-lg bg-muted/60 p-4 text-[11px] font-mono text-foreground/70 max-h-96">
                          {JSON.stringify(log.payload, null, 2)}
                        </pre>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground text-xs">
            Page {page} of {totalPages} &middot; {total} total events
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
              className="rounded-lg border border-border/60 px-3 py-1.5 text-xs hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
              className="rounded-lg border border-border/60 px-3 py-1.5 text-xs hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
