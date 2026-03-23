"use client";

import { useState, useTransition } from "react";
import { replyToMyTicket } from "@/actions/support";

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
  status: string;
  messages: Message[];
}

export function TicketThread({ ticket }: { ticket: Ticket }) {
  const [isPending, startTransition] = useTransition();
  const [reply, setReply] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  function handleReply() {
    startTransition(async () => {
      const result = await replyToMyTicket(ticket.id, reply);
      setFeedback(result.message);
      if (result.success) setReply("");
      setTimeout(() => setFeedback(null), 3000);
    });
  }

  return (
    <div className="space-y-6">
      {/* Thread */}
      <div className="space-y-4">
        {/* Original message */}
        {ticket.body && (
          <div className="rounded-xl border border-border/60 bg-muted/20 p-5">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-sm font-medium">You</span>
              <span className="ml-auto text-xs text-muted-foreground">
                Original message
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
                {msg.isFromAdmin ? "Support Team" : "You"}
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
      {ticket.status !== "CLOSED" ? (
        <div className="rounded-xl border border-border/60 p-5 space-y-4">
          <p className="text-sm font-medium">Reply</p>
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Type your reply…"
            rows={5}
            className="w-full resize-none rounded-lg border border-border/60 bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <button
            disabled={isPending || !reply.trim()}
            onClick={handleReply}
            className="px-5 py-2 rounded-lg bg-foreground text-background text-sm font-medium hover:bg-foreground/80 disabled:opacity-50 transition-colors"
          >
            {isPending ? "Sending…" : "Send Reply"}
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-border/60 p-5 text-center">
          <p className="text-sm text-muted-foreground">
            This ticket is closed. Need more help?{" "}
            <a
              href="/support/new"
              className="text-primary hover:text-primary/80 transition-colors"
            >
              Open a new ticket
            </a>
          </p>
        </div>
      )}

      {feedback && (
        <p className="text-sm text-primary text-center">{feedback}</p>
      )}
    </div>
  );
}
