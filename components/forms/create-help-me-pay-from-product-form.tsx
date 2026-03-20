"use client";

import { useState, useTransition } from "react";
import { createHelpMePayFromProduct } from "@/actions/help-me-pay";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useSession } from "@/lib/auth-client";
import { SignInLink } from "@/components/shared/sign-in-link";
import { DEADLINE_OPTIONS } from "@/lib/consts";
import { formatNaira } from "@/lib/types";
import { calculateInterest } from "@/lib/utils/interest";
import { toast } from "sonner";

interface CreateHelpMePayFromProductFormProps {
  productId: string;
  productName: string;
  productPrice: number;
  colors: string[];
  sizes: string[];
}

export function CreateHelpMePayFromProductForm({
  productId,
  productName,
  productPrice,
  colors,
  sizes,
}: CreateHelpMePayFromProductFormProps) {
  const { data: session } = useSession();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [deadlineDays, setDeadlineDays] = useState("30");
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-2xl border border-dashed border-border/60 bg-muted/20 px-4 py-4 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
      >
        <p className="text-sm font-semibold tracking-tight">Help Me Pay</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Create a campaign — let friends and family fund this for you
        </p>
      </button>
    );
  }

  const selectedDeadline = DEADLINE_OPTIONS.find(
    (d) => String(d.days) === deadlineDays,
  );
  const { interestAmount } = calculateInterest(
    productPrice,
    selectedDeadline?.days ?? 30,
  );
  const totalTarget = productPrice + interestAmount;

  function handleSubmit(formData: FormData) {
    formData.set("productId", productId);
    formData.set("deadlineDays", deadlineDays);
    formData.set("message", message.trim());
    if (selectedColor) formData.set("selectedColor", selectedColor);
    if (selectedSize) formData.set("selectedSize", selectedSize);

    startTransition(async () => {
      const result = await createHelpMePayFromProduct(formData);
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
        Create a fundraising link for <strong>{productName}</strong>. Share it
        so friends and family can contribute.
      </p>

      {session ? (
        <form action={handleSubmit} className="space-y-4">
          {colors.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="hmp-color">Colour (optional)</Label>
              <Select value={selectedColor} onValueChange={(v) => v && setSelectedColor(v)}>
                <SelectTrigger id="hmp-color" className="rounded-xl">
                  <SelectValue placeholder="Any colour" />
                </SelectTrigger>
                <SelectContent>
                  {colors.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {sizes.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="hmp-size">Size (optional)</Label>
              <Select value={selectedSize} onValueChange={(v) => v && setSelectedSize(v)}>
                <SelectTrigger id="hmp-size" className="rounded-xl">
                  <SelectValue placeholder="Any size" />
                </SelectTrigger>
                <SelectContent>
                  {sizes.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="hmp-message">Message (optional)</Label>
            <textarea
              id="hmp-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. Help me get this! It's my birthday soon 🎂"
              rows={3}
              disabled={isPending}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hmp-deadline">Deadline</Label>
            <Select value={deadlineDays} onValueChange={(v) => v && setDeadlineDays(v)}>
              <SelectTrigger id="hmp-deadline" className="rounded-xl">
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
          </div>

          <div className="rounded-xl bg-muted/40 px-4 py-3 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Product price</span>
              <span>{formatNaira(productPrice)}</span>
            </div>
            {interestAmount > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Platform fee ({selectedDeadline?.interestPercent}%)
                </span>
                <span>{formatNaira(interestAmount)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold border-t border-border/40 pt-1 mt-1">
              <span>Target to raise</span>
              <span>{formatNaira(totalTarget)}</span>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isPending}
            className="w-full rounded-xl"
          >
            {isPending ? "Creating campaign…" : "Create Help Me Pay link"}
          </Button>
        </form>
      ) : (
        <SignInLink className="text-sm font-medium text-primary hover:underline">
          Sign in to create a Help Me Pay campaign
        </SignInLink>
      )}
    </div>
  );
}
