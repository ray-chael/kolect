"use client";

import { useTransition, useState, useEffect } from "react";
import { createFlashSale, getProductsForSale } from "@/actions/flash-sales";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface ProductOption {
  id: string;
  name: string;
  markupPrice: number;
}

function formatNairaLocal(kobo: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(kobo / 100);
}

function toDatetimeLocal(d: Date | string) {
  const date = new Date(d);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function FlashSaleForm() {
  const [isPending, startTransition] = useTransition();
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [productId, setProductId] = useState("");
  const [salePrice, setSalePrice] = useState("");

  useEffect(() => {
    getProductsForSale().then((result) => {
      if (result.success && result.data) {
        setProducts(result.data as ProductOption[]);
      }
    });
  }, []);

  const selectedProduct = products.find((p) => p.id === productId);
  const salePriceNum = parseFloat(salePrice);
  const discountPercent =
    selectedProduct && !isNaN(salePriceNum) && salePriceNum > 0
      ? Math.round((1 - (salePriceNum * 100) / selectedProduct.markupPrice) * 100)
      : null;

  // Default start = now, end = 24h from now
  const defaultStart = toDatetimeLocal(new Date());
  const defaultEnd = toDatetimeLocal(new Date(Date.now() + 24 * 60 * 60 * 1000));

  function handleSubmit(formData: FormData) {
    formData.set("productId", productId);
    startTransition(async () => {
      const result = await createFlashSale(formData);
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success("Flash sale created!");
      window.location.href = "/admin/flash-sales";
    });
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <div className="rounded-2xl border border-border/60 bg-card p-6 space-y-5">
        <h2 className="font-display text-xl tracking-tight">Flash Sale Details</h2>

        <div className="space-y-2">
          <Label htmlFor="productId">Product</Label>
          <select
            id="productId"
            title="Select a product"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            required
            className="flex h-10 w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="">Select a product…</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {formatNairaLocal(p.markupPrice)}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="label">Sale Label</Label>
          <Input
            id="label"
            name="label"
            defaultValue="Flash Sale"
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
            placeholder="e.g. 45000"
            className="rounded-xl"
            value={salePrice}
            onChange={(e) => setSalePrice(e.target.value)}
          />
          {selectedProduct && discountPercent !== null && discountPercent > 0 && (
            <p className="text-xs text-primary font-medium">
              {discountPercent}% off the regular price of {formatNairaLocal(selectedProduct.markupPrice)}
            </p>
          )}
          {selectedProduct && discountPercent !== null && discountPercent <= 0 && (
            <p className="text-xs text-destructive">
              Sale price must be less than {formatNairaLocal(selectedProduct.markupPrice)}
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
              defaultValue={defaultStart}
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
              defaultValue={defaultEnd}
              className="rounded-xl"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button
          type="submit"
          disabled={isPending}
          className="rounded-full px-8 h-11"
        >
          {isPending ? "Creating…" : "Create Flash Sale"}
        </Button>
        <a
          href="/admin/flash-sales"
          className="inline-flex h-11 items-center rounded-full border border-border/60 px-8 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
