"use client";

import { useTransition, useState } from "react";
import { updateFlashSale } from "@/actions/flash-sales";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Link from "next/link";

interface FlashSaleEditData {
  id: string;
  label: string;
  salePrice: number;
  startsAt: Date | string;
  endsAt: Date | string;
  isActive: boolean;
  product: { id: string; name: string; markupPrice: number };
}

function formatNairaLocal(kobo: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(kobo / 100);
}

function toDatetimeLocal(d: Date | string) {
  const date = new Date(d);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function FlashSaleEditForm({ sale }: { sale: FlashSaleEditData }) {
  const [isPending, startTransition] = useTransition();
  const [salePrice, setSalePrice] = useState(String(sale.salePrice / 100));
  const [isActive, setIsActive] = useState(sale.isActive);

  const salePriceNum = parseFloat(salePrice);
  const discountPercent =
    !isNaN(salePriceNum) && salePriceNum > 0
      ? Math.round((1 - (salePriceNum * 100) / sale.product.markupPrice) * 100)
      : null;

  function handleSubmit(formData: FormData) {
    formData.set("isActive", String(isActive));
    startTransition(async () => {
      const result = await updateFlashSale(sale.id, formData);
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success("Flash sale updated!");
      window.location.href = "/admin/flash-sales";
    });
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <div className="rounded-2xl border border-border/60 bg-card p-6 space-y-5">
        <h2 className="font-display text-xl tracking-tight">Edit Flash Sale</h2>

        <div className="space-y-2">
          <Label>Product</Label>
          <p className="text-sm font-medium">
            {sale.product.name}{" "}
            <span className="text-muted-foreground">
              — Regular price: {formatNairaLocal(sale.product.markupPrice)}
            </span>
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="label">Sale Label</Label>
          <Input
            id="label"
            name="label"
            defaultValue={sale.label}
            placeholder="e.g. Flash Sale, Weekend Deal"
            className="rounded-xl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="salePrice">Sale Price (₦)</Label>
          <Input
            id="salePrice"
            name="salePrice"
            type="number"
            min="1"
            step="0.01"
            required
            className="rounded-xl"
            value={salePrice}
            onChange={(e) => setSalePrice(e.target.value)}
          />
          {discountPercent !== null && discountPercent > 0 && (
            <p className="text-xs text-primary font-medium">
              {discountPercent}% off the regular price
            </p>
          )}
          {discountPercent !== null && discountPercent <= 0 && (
            <p className="text-xs text-destructive">
              Sale price must be less than{" "}
              {formatNairaLocal(sale.product.markupPrice)}
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="startsAt">Starts At</Label>
            <Input
              id="startsAt"
              name="startsAt"
              type="datetime-local"
              required
              defaultValue={toDatetimeLocal(sale.startsAt)}
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endsAt">Ends At</Label>
            <Input
              id="endsAt"
              name="endsAt"
              type="datetime-local"
              required
              defaultValue={toDatetimeLocal(sale.endsAt)}
              className="rounded-xl"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            title="Set Is Active"
            type="button"
            role="switch"
            aria-checked={isActive}
            onClick={() => setIsActive((v) => !v)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              isActive ? "bg-primary" : "bg-muted-foreground/30"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isActive ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
          <Label
            className="cursor-pointer"
            onClick={() => setIsActive((v) => !v)}
          >
            {isActive ? "Active" : "Paused"}
          </Label>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button
          type="submit"
          disabled={isPending}
          className="rounded-full px-8 h-11"
        >
          {isPending ? "Saving…" : "Save Changes"}
        </Button>
        <Link
          href="/admin/flash-sales"
          className="inline-flex h-11 items-center rounded-full border border-border/60 px-8 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
