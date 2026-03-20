"use client";

import { useState, useTransition } from "react";
import { createHelpMePay } from "@/actions/help-me-pay";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { DEADLINE_OPTIONS } from "@/lib/consts";
import { toast } from "sonner";

interface CreateHelpMePayFormProps {
  orderId: string;
}

export function CreateHelpMePayForm({ orderId }: CreateHelpMePayFormProps) {
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [deadlineDays, setDeadlineDays] = useState("30");

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-2xl border border-dashed border-border/60 bg-muted/20 px-4 py-4 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
      >
        <p className="text-sm font-semibold tracking-tight">Help Me Pay</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Share a link so friends and family can help pay for this order
        </p>
      </button>
    );
  }

  function handleSubmit(formData: FormData) {
    formData.set("orderId", orderId);
    formData.set("message", message.trim());
    formData.set("deadlineDays", deadlineDays);

    startTransition(async () => {
      const result = await createHelpMePay(formData);
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      if (result.data?.slug) {
        window.location.href = `/help-me-pay/${result.data.slug}`;
      }
    });
  }

  const selectedDeadline = DEADLINE_OPTIONS.find(
    (d) => String(d.days) === deadlineDays,
  );

  return (
    <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg tracking-tight">Help Me Pay</h3>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancel
        </button>
      </div>

      <p className="text-xs text-muted-foreground">
        Create a shareable link. Friends and family can help contribute toward
        your remaining balance.
      </p>

      <form action={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="hmp-message">Message (optional)</Label>
          <textarea
            id="hmp-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="e.g. Help me get this as a birthday gift!"
            disabled={isPending}
            className="flex min-h-[80px] w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        <div className="space-y-2">
          <Label>Deadline</Label>
          <Select value={deadlineDays} onValueChange={(v) => v && setDeadlineDays(v)}>
            <SelectTrigger className="rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DEADLINE_OPTIONS.map((opt) => (
                <SelectItem key={opt.days} value={String(opt.days)}>
                  {opt.label}
                  {opt.interestPercent > 0
                    ? ` (+${opt.interestPercent}% fee)`
                    : " (no fee)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedDeadline && selectedDeadline.interestPercent > 0 && (
            <p className="text-xs text-warm">
              A {selectedDeadline.interestPercent}% platform fee applies for the{" "}
              {selectedDeadline.label} deadline.
            </p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isPending}
          className="w-full h-11 rounded-full font-medium tracking-wide"
        >
          {isPending ? "Creating..." : "Create Help Me Pay Link"}
        </Button>
      </form>
    </div>
  );
}
