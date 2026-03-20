"use client";

import { useTransition } from "react";
import { contributeToGroupBuy } from "@/actions/group-buy";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatNaira, koboToNaira, nairaToKobo } from "@/lib/types";
import { MIN_HELPER_CONTRIBUTION_KOBO } from "@/lib/consts";
import { toast } from "sonner";

interface GroupBuyContributeFormProps {
  groupBuyId: string;
  remaining: number;
  splitType: "EQUAL" | "FLEXIBLE";
  targetAmount: number;
  contributorCount: number;
  maxMembers: number;
}

export function GroupBuyContributeForm({
  groupBuyId,
  remaining,
  splitType,
  targetAmount,
  contributorCount,
  maxMembers,
}: GroupBuyContributeFormProps) {
  const [isPending, startTransition] = useTransition();

  const minKobo = Math.min(MIN_HELPER_CONTRIBUTION_KOBO, remaining);
  const equalShare = Math.ceil(remaining / Math.max(1, maxMembers - contributorCount));
  const suggestedAmount =
    splitType === "EQUAL" ? Math.max(equalShare, minKobo) : minKobo;

  function handleSubmit(formData: FormData) {
    const nairaValue = Number(formData.get("amountNaira"));
    const amountKobo = nairaToKobo(nairaValue);

    if (amountKobo < minKobo) {
      toast.error(`Minimum contribution is ${formatNaira(minKobo)}`);
      return;
    }

    formData.set("groupBuyId", groupBuyId);
    formData.set("amount", String(amountKobo));

    startTransition(async () => {
      const result = await contributeToGroupBuy(formData);
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
          <Label htmlFor="gb-name">Your name</Label>
          <Input
            id="gb-name"
            name="name"
            required
            disabled={isPending}
            placeholder="Enter your name"
            className="rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gb-email">Email (for ownership proof)</Label>
          <Input
            id="gb-email"
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
        <Label htmlFor="gb-amount">
          Amount (₦) — min {formatNaira(minKobo)}, max{" "}
          {formatNaira(remaining)}
        </Label>
        <Input
          id="gb-amount"
          name="amountNaira"
          type="number"
          min={koboToNaira(minKobo)}
          max={koboToNaira(remaining)}
          step={1}
          defaultValue={koboToNaira(suggestedAmount)}
          required
          disabled={isPending}
          className="rounded-xl"
        />
        {splitType === "EQUAL" && (
          <p className="text-xs text-muted-foreground">
            Equal split: suggested share is {formatNaira(equalShare)} per person
          </p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full h-11 rounded-full font-medium tracking-wide"
        disabled={isPending}
      >
        {isPending ? "Processing..." : "Contribute & Pay"}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        You&apos;ll be redirected to Paystack for secure payment.
        {contributorCount > 0 &&
          ` ${contributorCount} contributor${contributorCount !== 1 ? "s" : ""} so far.`}
      </p>
    </form>
  );
}
