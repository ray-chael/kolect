"use client";

import { useState, useTransition } from "react";
import { contributeToHelpMePay } from "@/actions/help-me-pay";
import type { BankTransferDetails } from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatNaira, koboToNaira, nairaToKobo } from "@/lib/types";
import { MIN_HELPER_CONTRIBUTION_KOBO } from "@/lib/consts";
import { toast } from "sonner";

interface HelpMePayContributeFormProps {
  helpMePayId: string;
  remaining: number;
  bankTransfer?: BankTransferDetails;
}

export function HelpMePayContributeForm({
  helpMePayId,
  remaining,
  bankTransfer,
}: HelpMePayContributeFormProps) {
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<"card" | "transfer">("card");

  const minKobo = Math.min(MIN_HELPER_CONTRIBUTION_KOBO, remaining);
  const [amountNaira, setAmountNaira] = useState(koboToNaira(minKobo));

  const showTabs = bankTransfer?.enabled;

  function handleSubmit(formData: FormData) {
    if (mode === "transfer") return;

    const nairaValue = Number(formData.get("amountNaira"));
    const amountKobo = nairaToKobo(nairaValue);

    if (amountKobo < minKobo) {
      toast.error(`Minimum contribution is ${formatNaira(minKobo)}`);
      return;
    }

    formData.set("helpMePayId", helpMePayId);
    formData.set("amount", String(amountKobo));

    startTransition(async () => {
      const result = await contributeToHelpMePay(formData);
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success("Redirecting to payment...");
      if (result.data?.authorizationUrl) {
        window.location.href = result.data.authorizationUrl;
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="hmp-name">Your name</Label>
          <Input
            id="hmp-name"
            name="name"
            required
            disabled={isPending}
            placeholder="Enter your name"
            className="rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="hmp-email">Email</Label>
          <Input
            id="hmp-email"
            name="email"
            type="email"
            required
            disabled={isPending}
            placeholder="you@example.com"
            className="rounded-xl"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="hmp-amount">
          Amount (₦) — min {formatNaira(minKobo)}, max {formatNaira(remaining)}
        </Label>
        <Input
          id="hmp-amount"
          name="amountNaira"
          type="number"
          min={koboToNaira(minKobo)}
          max={koboToNaira(remaining)}
          step={1}
          value={amountNaira}
          onChange={(e) => setAmountNaira(Number(e.target.value))}
          required
          disabled={isPending}
          className="rounded-xl"
        />
      </div>

      {/* Payment method tabs */}
      {showTabs && (
        <div className="flex rounded-xl border border-border/60 p-1 gap-1 w-full">
          <button
            type="button"
            onClick={() => setMode("card")}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              mode === "card"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Pay with Card
          </button>
          <button
            type="button"
            onClick={() => setMode("transfer")}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              mode === "transfer"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Pay by Transfer
          </button>
        </div>
      )}

      {/* Bank transfer details */}
      {showTabs && mode === "transfer" && bankTransfer && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border/60 bg-muted/40 divide-y divide-border/40">
            <div className="flex justify-between items-center px-4 py-3 text-sm">
              <span className="text-muted-foreground">Bank</span>
              <span className="font-medium">
                {bankTransfer.bankName || "—"}
              </span>
            </div>
            <div className="flex justify-between items-center px-4 py-3 text-sm">
              <span className="text-muted-foreground">Account name</span>
              <span className="font-medium">
                {bankTransfer.accountName || "—"}
              </span>
            </div>
            <div className="flex justify-between items-center px-4 py-3 text-sm">
              <span className="text-muted-foreground">Account number</span>
              <button
                type="button"
                className="font-mono font-semibold tracking-wide hover:text-primary transition-colors"
                onClick={() => {
                  navigator.clipboard.writeText(bankTransfer.accountNumber);
                  toast.success("Account number copied");
                }}
              >
                {bankTransfer.accountNumber || "—"}
              </button>
            </div>
            <div className="flex justify-between items-center px-4 py-3 text-sm">
              <span className="text-muted-foreground">Amount to transfer</span>
              <span className="font-semibold text-primary">
                {amountNaira > 0 ? formatNaira(nairaToKobo(amountNaira)) : "—"}
              </span>
            </div>
          </div>

          {bankTransfer.note && (
            <p className="text-xs text-muted-foreground">{bankTransfer.note}</p>
          )}

          <div className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30 px-4 py-3 text-sm text-amber-800 dark:text-amber-300 space-y-1">
            <p className="font-medium">After transferring:</p>
            <p>
              Send your receipt to{" "}
              <a
                href={`mailto:receipts@kolekt.com.ng?subject=Help Me Pay Contribution: ${helpMePayId}`}
                className="font-mono underline underline-offset-2"
              >
                receipts@kolekt.com.ng
              </a>{" "}
              with subject:{" "}
              <button
                type="button"
                className="font-mono text-xs break-all underline underline-offset-2 hover:opacity-75 transition-opacity cursor-copy"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `Help Me Pay Contribution: ${helpMePayId}`,
                  );
                  toast.success("Subject copied");
                }}
              >
                Help Me Pay Contribution: {helpMePayId}
              </button>
            </p>
            <p className="text-xs opacity-75">
              We&apos;ll confirm your contribution within 1 business day.
            </p>
          </div>
        </div>
      )}

      {/* Card submit */}
      {(!showTabs || mode === "card") && (
        <Button
          type="submit"
          className="w-full h-11 rounded-full font-medium tracking-wide"
          disabled={isPending}
        >
          {isPending ? "Processing..." : "Help & Pay"}
        </Button>
      )}

      {(!showTabs || mode === "card") && (
        <p className="text-xs text-center text-muted-foreground">
          You&apos;ll be redirected to Paystack for secure payment. Minimum
          contribution is ₦1,000.
        </p>
      )}
    </form>
  );
}
