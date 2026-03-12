import { productService } from "@/lib/services/product.service";
import { formatNaira } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await productService.getAll();

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <p className="text-xs tracking-[0.25em] uppercase text-primary mb-2">Inventory</p>
          <h1 className="font-display text-3xl tracking-tight">Products</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {products.length} products
          </p>
        </div>
        <a
          href="/admin/products/new"
          className="inline-flex h-11 items-center rounded-full bg-primary px-6 text-sm font-medium tracking-wide text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors"
        >
          Add Product
        </a>
      </div>

      <div className="rounded-2xl border border-border/60 overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-border/40 bg-muted/30">
              <th className="px-5 py-3.5 text-left text-xs tracking-[0.1em] uppercase font-medium text-muted-foreground">Name</th>
              <th className="px-5 py-3.5 text-left text-xs tracking-[0.1em] uppercase font-medium text-muted-foreground">Original Cost</th>
              <th className="px-5 py-3.5 text-left text-xs tracking-[0.1em] uppercase font-medium text-muted-foreground">Markup Price</th>
              <th className="px-5 py-3.5 text-left text-xs tracking-[0.1em] uppercase font-medium text-muted-foreground">Status</th>
              <th className="px-5 py-3.5 text-left text-xs tracking-[0.1em] uppercase font-medium text-muted-foreground">Pre-order</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-b border-border/40 last:border-0 transition-colors hover:bg-muted/20">
                <td className="px-5 py-4">
                  <a
                    href={`/admin/products/${product.id}`}
                    className="font-medium text-foreground hover:text-primary transition-colors"
                  >
                    {product.name}
                  </a>
                </td>
                <td className="px-5 py-4 text-muted-foreground">
                  {formatNaira(product.originalCost)}
                </td>
                <td className="px-5 py-4">{formatNaira(product.markupPrice)}</td>
                <td className="px-5 py-4">
                  <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
                    {product.status}
                  </span>
                </td>
                <td className="px-5 py-4">
                  {product.isPreorder ? "Yes" : "No"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
