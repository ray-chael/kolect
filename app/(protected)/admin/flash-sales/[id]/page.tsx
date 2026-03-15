import { flashSaleService } from "@/lib/services/flash-sale.service";
import { FlashSaleEditForm } from "@/components/forms/flash-sale-edit-form";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditFlashSalePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sale = await flashSaleService.getById(id);
  if (!sale) notFound();

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <div className="mb-8">
        <p className="text-xs tracking-[0.25em] uppercase text-primary mb-2">Promotions</p>
        <h1 className="font-display text-3xl tracking-tight">Edit Flash Sale</h1>
        <p className="mt-1 text-sm text-muted-foreground">{sale.product.name}</p>
      </div>
      <FlashSaleEditForm sale={sale} />
    </div>
  );
}
