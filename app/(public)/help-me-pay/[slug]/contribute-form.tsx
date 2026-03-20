"use client";

import { useTransition } from "react";
import { contributeToHelpMePay } from "@/actions/help-me-pay";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatNaira, koboToNaira, nairaToKobo } from "@/lib/types";
import { MIN_HELPER_CONTRIBUTION_KOBO } from "@/lib/consts";
import { toast } from "sonner";

interface HelpMePayContributeFormProps {
  helpMePayId: string;
  remaining: number;
}

export function HelpMePayContributeForm({
  helpMePayId,
  remaining,
}: HelpMePayContributeFormProps) {
  const [isPending, startTransition] = useTransition();

  const minKobo = Math.min(MIN_HELPER_CONTRIBUTION_KOBO, remaining);

  function handleSubmit(formData: FormData) {
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
          Amount (₦) — min {formatNaira(minKobo)}, max{" "}
          {formatNaira(remaining)}
        </Label>
        <Input
          id="hmp-amount"
          name="amountNaira"
          type="number"
          min={koboToNaira(minKobo)}
          max={koboToNaira(remaining)}
          step={1}
          defaultValue={koboToNaira(minKobo)}
          required
          disabled={isPending}
          className="rounded-xl"
        />
      </div>

      <Button
        type="submit"
        className="w-full h-11 rounded-full font-medium tracking-wide"
        disabled={isPending}
      >
        {isPending ? "Processing..." : "Help & Pay"}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        You&apos;ll be redirected to Paystack for secure payment. Minimum
        contribution is ₦1,000.
      </p>
    </form>
  );
}
