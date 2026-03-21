"use client";

import { useState, useTransition } from "react";
import { updateTicketStatus, replyToTicket, updateTicketNotes } from "@/actions/support";
import type { SupportTicketStatus } from "@/app/generated/prisma/client";

interface Message {
  id: string;
  fromEmail: string;
  body: string;
  isFromAdmin: boolean;
  createdAt: Date;
}

interface Ticket {
  id: string;
  fromEmail: string;
  fromName: string | null;
  subject: string;
  body: string | null;
  status: SupportTicketStatus;
  orderId: string | null;
  adminNotes: string | null;
  messages: Message[];
}

export function TicketActions({ ticket }: { ticket: Ticket }) {
  const [isPending, startTransition] = useTransition();
  const [reply, setReply] = useState("");
  const [notes, setNotes] = useState(ticket.adminNotes ?? "");
  const [feedback, setFeedback] = useState<string | null>(null);

  function act(fn: () => Promise<{ success: boolean; message: string }>) {
    startTransition(async () => {
      const result = await fn();
      setFeedback(result.message);
      setTimeout(() => setFeedback(null), 3000);
    });
  }

  return (
    <div className="space-y-8">
      {/* Thread */}
      <div className="space-y-4">
        {/* Original message */}
        {ticket.body && (
          <div className="rounded-xl border border-border/60 bg-muted/20 p-5">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-sm font-medium">
                {ticket.fromName ?? ticket.fromEmail}
              </span>
              <span className="text-xs text-muted-foreground">
                {ticket.fromEmail}
              </span>
              <span className="ml-auto text-xs text-muted-foreground">
                Original
              </span>
            </div>
            <p className="text-sm whitespace-pre-wrap leading-relaxed">
              {ticket.body}
            </p>
          </div>
        )}

        {/* Replies */}
        {ticket.messages.map((msg) => (
          <div
            key={msg.id}
            className={`rounded-xl border p-5 ${
              msg.isFromAdmin
                ? "border-primary/30 bg-primary/5 ml-8"
                : "border-border/60 bg-muted/20"
            }`}
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-sm font-medium">
                {msg.isFromAdmin ? "Support Team" : ticket.fromName ?? ticket.fromEmail}
              </span>
              <span className="text-xs text-muted-foreground">
                {msg.fromEmail}
              </span>
              <span className="ml-auto text-xs text-muted-foreground">
                {new Date(msg.createdAt).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <p className="text-sm whitespace-pre-wrap leading-relaxed">
              {msg.body}
            </p>
          </div>
        ))}
      </div>

      {/* Reply form */}
      {ticket.status !== "CLOSED" && (
        <div className="rounded-xl border border-border/60 p-5 space-y-4">
          <p className="text-sm font-medium">Reply to customer</p>
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Type your reply…"
            rows={5}
            className="w-full resize-none rounded-lg border border-border/60 bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <button
            disabled={isPending || !reply.trim()}
            onClick={() =>
              act(async () => {
                const res = await replyToTicket(ticket.id, reply);
                if (res.success) setReply("");
                return res;
              })
            }
            className="px-5 py-2 rounded-lg bg-foreground text-background text-sm font-medium hover:bg-foreground/80 disabled:opacity-50 transition-colors"
          >
            {isPending ? "Sending…" : "Send Reply"}
          </button>
        </div>
      )}

      {/* Status controls */}
      <div className="rounded-xl border border-border/60 p-5 space-y-4">
        <p className="text-sm font-medium">Change status</p>
        <div className="flex gap-2 flex-wrap">
          {(["OPEN", "IN_PROGRESS", "CLOSED"] as SupportTicketStatus[]).map(
            (s) => (
              <button
                key={s}
                disabled={isPending || ticket.status === s}
                onClick={() => act(() => updateTicketStatus(ticket.id, s))}
                className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-colors disabled:opacity-50 ${
                  ticket.status === s
                    ? "bg-foreground text-background border-foreground"
                    : "border-border/60 text-muted-foreground hover:text-foreground"
                }`}
              >
                {s.replace("_", " ")}
              </button>
            ),
          )}
        </div>
      </div>

      {/* Admin notes */}
      <div className="rounded-xl border border-border/60 p-5 space-y-4">
        <p className="text-sm font-medium">Internal notes</p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes visible only to admins…"
          rows={3}
          className="w-full resize-none rounded-lg border border-border/60 bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        <button
          disabled={isPending}
          onClick={() => act(() => updateTicketNotes(ticket.id, notes))}
          className="px-5 py-2 rounded-lg bg-foreground text-background text-sm font-medium hover:bg-foreground/80 disabled:opacity-50 transition-colors"
        >
          Save Notes
        </button>
      </div>

      {feedback && (
        <p className="text-sm text-primary text-center">{feedback}</p>
      )}
    </div>
  );
}
