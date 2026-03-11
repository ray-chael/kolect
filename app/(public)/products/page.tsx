import { productService } from "@/lib/services/product.service";
import { formatNaira } from "@/lib/types";
import Image from "next/image";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const products = await productService.getAll();

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-10">
        <p className="text-xs tracking-[0.25em] uppercase text-primary mb-2">Browse</p>
        <h1 className="font-display text-4xl tracking-tight">Our Collection</h1>
        <p className="mt-2 text-muted-foreground">
          Curated items at unbeatable prices — pre-order or pay in installments
        </p>
      </div>

      {products.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-muted-foreground">No products available yet.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <a
              key={product.id}
              href={`/products/${product.slug}`}
              className="group rounded-2xl border border-border/60 bg-card p-5 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="mb-4 relative aspect-square rounded-xl bg-muted/60 overflow-hidden">
                {product.images[0] && (
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                )}
              </div>
              <h3 className="font-semibold tracking-tight group-hover:text-primary transition-colors duration-300">
                {product.name}
              </h3>
              <p className="mt-1 text-lg font-bold text-foreground">
                {formatNaira(product.markupPrice)}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {product.isPreorder && (
                  <span className="inline-block rounded-full bg-warm/10 px-2.5 py-0.5 text-xs font-medium text-warm dark:text-warm">
                    Pre-order
                  </span>
                )}
                {product.category && (
                  <span className="inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                    {product.category.name}
                  </span>
                )}
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                Pay from {formatNaira(Math.round(product.markupPrice * 0.2))}{" "}
                deposit
              </p>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
