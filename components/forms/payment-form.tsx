"use client";

import { useTransition } from "react";
import { initiatePayment } from "@/actions/orders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MIN_INSTALLMENT_KOBO } from "@/lib/consts";
import { formatNaira, koboToNaira, nairaToKobo } from "@/lib/types";
import { toast } from "sonner";

interface PaymentFormProps {
  orderId: string;
  remainingKobo: number;
  isDepositPaid: boolean;
  preferFullPayment?: boolean;
}

export function PaymentForm({
  orderId,
  remainingKobo,
  isDepositPaid,
  preferFullPayment = false,
}: PaymentFormProps) {
  const [isPending, startTransition] = useTransition();

  const minNaira = Math.max(
    koboToNaira(MIN_INSTALLMENT_KOBO),
    remainingKobo < MIN_INSTALLMENT_KOBO ? koboToNaira(remainingKobo) : koboToNaira(MIN_INSTALLMENT_KOBO)
  );
  const maxNaira = koboToNaira(remainingKobo);
  const defaultNaira = preferFullPayment ? maxNaira : minNaira;

  function handleSubmit(formData: FormData) {
    // Convert naira input to kobo for the server action
    const nairaValue = Number(formData.get("amountNaira"));
    formData.set("amount", String(nairaValue * 100));
    startTransition(async () => {
      const result = await initiatePayment(formData);
      if (!result.success) {
        toast.error(result.message ?? "Payment initiation failed");
        return;
      }
      toast.success("Redirecting to payment...");
      // Redirect to Paystack payment page
      if (result.data?.authorizationUrl) {
        window.location.href = result.data.authorizationUrl;
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <input type="hidden" name="orderId" value={orderId} />

      <div className="space-y-2">
        <Label htmlFor="amount">
          Amount (₦) — min {formatNaira(nairaToKobo(minNaira))}, max{" "}
          {formatNaira(remainingKobo)}
        </Label>
        <Input
          id="amount"
          name="amountNaira"
          type="number"
          min={minNaira}
          max={maxNaira}
          step={1}
          defaultValue={defaultNaira}
          required
          disabled={isPending}
        />
        <p className="text-xs text-muted-foreground">
          {preferFullPayment && !isDepositPaid
            ? "This order is set up for outright purchase, so the full balance is selected by default."
            : isDepositPaid
            ? "Top up your balance towards full payment."
            : "This initial payment serves as your non-refundable deposit."}
        </p>
      </div>

      <Button type="submit" className="w-full h-11 rounded-full font-medium tracking-wide" disabled={isPending}>
        {isPending
          ? "Processing..."
          : preferFullPayment && !isDepositPaid
            ? "Pay Full Amount"
            : `Pay ${isDepositPaid ? "" : "(Deposit) "}`}
      </Button>
    </form>
  );
}
