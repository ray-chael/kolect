"use client";

import { useState, useTransition } from "react";
import { createTicket } from "@/actions/support";
import { useRouter } from "next/navigation";

export function CreateTicketForm({
  orders,
}: {
  orders: { id: string; productName: string }[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [orderId, setOrderId] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createTicket(
        subject,
        body,
        orderId || undefined,
      );
      if (result.success && result.data) {
        router.push(`/support/${result.data.ticketId}`);
      } else {
        setError(result.message);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {orders.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Related Order{" "}
            <span className="text-muted-foreground font-normal">
              (optional)
            </span>
          </label>
          <select
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            aria-label="Related order"
            className="w-full rounded-lg border border-border/60 bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="">No specific order</option>
            {orders.map((order) => (
              <option key={order.id} value={order.id}>
                {order.productName} — #{order.id.slice(-8).toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium">Subject</label>
        <input
          type="text"
          required
          minLength={3}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Brief summary of your issue"
          className="w-full rounded-lg border border-border/60 bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Message</label>
        <textarea
          required
          minLength={10}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Describe your issue in detail…"
          rows={8}
          className="w-full resize-none rounded-lg border border-border/60 bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2.5 rounded-lg bg-foreground text-background text-sm font-medium hover:bg-foreground/80 disabled:opacity-50 transition-colors"
        >
          {isPending ? "Submitting…" : "Submit Ticket"}
        </button>
        <a
          href="/support"
          className="px-6 py-2.5 rounded-lg border border-border/60 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
