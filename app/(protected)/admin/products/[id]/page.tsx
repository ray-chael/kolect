import { productService } from "@/lib/services/product.service";
import { ProductEditForm } from "@/components/forms/product-edit-form";
import { notFound } from "next/navigation";
import { coerceProductCustomFields } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminEditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await productService.getById(id);

  if (!product) {
    notFound();
  }

  const normalizedProduct = {
    ...product,
    customFields: coerceProductCustomFields(product.customFields),
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <a
        href="/admin/products"
        className="text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        &larr; Back to Products
      </a>

      <div className="mt-6 mb-8">
        <p className="text-xs tracking-[0.25em] uppercase text-primary mb-2">
          Inventory
        </p>
        <h1 className="font-display text-3xl tracking-tight">
          Edit Product
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{product.name}</p>
      </div>

      <ProductEditForm product={normalizedProduct} />
    </div>
  );
}
