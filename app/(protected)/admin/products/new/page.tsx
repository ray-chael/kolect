import { ProductForm } from "@/components/forms/product-form";

export default function AdminNewProductPage() {
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
          New Product
        </h1>
      </div>

      <ProductForm />
    </div>
  );
}
