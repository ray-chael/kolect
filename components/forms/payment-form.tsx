"use client";

import { useState, useTransition } from "react";
import { initiatePayment } from "@/actions/orders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MIN_INSTALLMENT_KOBO } from "@/lib/consts";
import { formatNaira, koboToNaira, nairaToKobo } from "@/lib/types";
import { toast } from "sonner";
import type { BankTransferDetails } from "@/actions/settings";

interface PaymentFormProps {
  orderId: string;
  remainingKobo: number;
  isDepositPaid: boolean;
  preferFullPayment?: boolean;
  bankTransfer?: BankTransferDetails;
}

export function PaymentForm({
  orderId,
  remainingKobo,
  isDepositPaid,
  preferFullPayment = false,
  bankTransfer,
}: PaymentFormProps) {
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<"card" | "transfer">("card");

  const minNaira = Math.max(
    koboToNaira(MIN_INSTALLMENT_KOBO),
    remainingKobo < MIN_INSTALLMENT_KOBO
      ? koboToNaira(remainingKobo)
      : koboToNaira(MIN_INSTALLMENT_KOBO),
  );
  const maxNaira = koboToNaira(remainingKobo);
  const defaultNaira = preferFullPayment ? maxNaira : minNaira;

  const showTabs = bankTransfer?.enabled;

  function handleSubmit(formData: FormData) {
    const nairaValue = Number(formData.get("amountNaira"));
    formData.set("amount", String(nairaValue * 100));
    startTransition(async () => {
      const result = await initiatePayment(formData);
      if (!result.success) {
        toast.error(result.message ?? "Payment initiation failed");
        return;
      }
      toast.success("Redirecting to payment...");
      if (result.data?.authorizationUrl) {
        window.location.href = result.data.authorizationUrl;
      }
    });
  }

  const amountHint =
    preferFullPayment && !isDepositPaid
      ? "This order is set up for outright purchase, so the full balance is selected by default."
      : isDepositPaid
        ? "Top up your balance towards full payment."
        : "This initial payment serves as your non-refundable deposit.";

  return (
    <div className="space-y-5">
      {/* Mode tabs */}
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

      {/* Bank Transfer panel */}
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
                {formatNaira(remainingKobo)}
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
                href={`mailto:receipts@kolekt.ng?subject=Payment for Order ${orderId}`}
                className="font-mono underline underline-offset-2"
              >
                receipts@kolekt.ng
              </a>{" "}
              with your order ID in the subject line:{" "}
              <span className="font-mono text-xs break-all">{orderId}</span>
            </p>
            <p className="text-xs opacity-75">
              We&apos;ll confirm your payment within 1 business day.
            </p>
          </div>
        </div>
      )}

      {/* Card payment form */}
      {(!showTabs || mode === "card") && (
        <form action={handleSubmit} className="space-y-4">
          <input type="hidden" name="orderId" value={orderId} />

          <div className="space-y-2">
            <Label htmlFor="amountNaira">
              Amount (₦) — min {formatNaira(nairaToKobo(minNaira))}, max{" "}
              {formatNaira(remainingKobo)}
            </Label>
            <Input
              id="amountNaira"
              name="amountNaira"
              type="number"
              min={minNaira}
              max={maxNaira}
              step={1}
              defaultValue={defaultNaira}
              required
              disabled={isPending}
            />
            <p className="text-xs text-muted-foreground">{amountHint}</p>
          </div>

          <Button
            type="submit"
            className="w-full h-11 rounded-full font-medium tracking-wide"
            disabled={isPending}
          >
            {isPending
              ? "Processing..."
              : preferFullPayment && !isDepositPaid
                ? "Pay Full Amount"
                : `Pay ${isDepositPaid ? "" : "(Deposit) "}`}
          </Button>
        </form>
      )}
    </div>
  );
}
