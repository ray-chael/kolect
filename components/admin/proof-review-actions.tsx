"use client";

import { useState, useTransition } from "react";
import { reviewPaymentProof } from "@/actions/support";

interface ProofReviewProps {
  proofId: string;
  currentStatus: string;
}

export function ProofReviewActions({ proofId, currentStatus }: ProofReviewProps) {
  const [isPending, startTransition] = useTransition();
  const [notes, setNotes] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  function act(status: "APPROVED" | "REJECTED") {
    startTransition(async () => {
      const result = await reviewPaymentProof(proofId, status, notes || undefined);
      setFeedback(result.message);
      setTimeout(() => setFeedback(null), 4000);
    });
  }

  if (currentStatus !== "PENDING") {
    return (
      <p className="text-sm text-muted-foreground">
        This proof has already been reviewed ({currentStatus}).
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Optional notes for the customer (shown on rejection)…"
        rows={3}
        className="w-full resize-none rounded-lg border border-border/60 bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
      />
      <div className="flex gap-3">
        <button
          disabled={isPending}
          onClick={() => act("APPROVED")}
          className="px-5 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {isPending ? "Processing…" : "Approve"}
        </button>
        <button
          disabled={isPending}
          onClick={() => act("REJECTED")}
          className="px-5 py-2 rounded-lg border border-red-500/40 text-red-600 text-sm font-medium hover:bg-red-500/10 disabled:opacity-50 transition-colors"
        >
          {isPending ? "Processing…" : "Reject"}
        </button>
      </div>
      {feedback && (
        <p className="text-sm text-primary">{feedback}</p>
      )}
    </div>
  );
}
