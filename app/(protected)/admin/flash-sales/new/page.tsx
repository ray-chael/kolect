import { FlashSaleForm } from "@/components/forms/flash-sale-form";

export default function NewFlashSalePage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <div className="mb-8">
        <p className="text-xs tracking-[0.25em] uppercase text-primary mb-2">Promotions</p>
        <h1 className="font-display text-3xl tracking-tight">New Flash Sale</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Set a discounted price for a product over a limited time window.
        </p>
      </div>
      <FlashSaleForm />
    </div>
  );
}
