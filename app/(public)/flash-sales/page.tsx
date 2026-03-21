import Image from "next/image";
import Link from "next/link";
import { formatNaira } from "@/lib/types";
import { productService } from "@/lib/services/product.service";
import { FlashSaleCountdown } from "@/components/shared/flash-sale-countdown";
import { ProductVideoThumbnail } from "@/components/shared/product-video-thumbnail";

export const metadata = {
  title: "Flash Sales — Ade's Kolekt",
  description: "Limited-time deals. Shop now before they're gone.",
};

export const revalidate = 60;

export default async function FlashSalesPage() {
  const allProducts = await productService.getAll();
  const products = allProducts.filter((p) => (p.flashSales?.length ?? 0) > 0);

  const earliestEndsAt =
    products.length > 0
      ? products
          .map((p) => p.flashSales[0].endsAt.getTime())
          .sort((a, b) => a - b)[0]
      : null;
  const endsAtIso = earliestEndsAt
    ? new Date(earliestEndsAt).toISOString()
    : null;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-destructive px-3 py-1.5 shadow-sm mb-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="text-destructive-foreground"
            >
              <path d="M13 2L4.09 12.96A1 1 0 0 0 5 14.5h5.5L11 22l8.91-10.96A1 1 0 0 0 19 9.5H13.5L13 2Z" />
            </svg>
            <span className="text-xs font-bold tracking-wide text-destructive-foreground uppercase">
              Flash Sales
            </span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl tracking-tight">
            Limited-time deals
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {products.length} deal{products.length !== 1 ? "s" : ""} available —
            buy before they&apos;re gone
          </p>
        </div>

        {endsAtIso && (
          <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-2.5">
            <span className="text-xs uppercase tracking-widest text-muted-foreground">
              Ends in
            </span>
            <span className="text-sm font-bold text-foreground">
              <FlashSaleCountdown endsAt={endsAtIso} />
            </span>
          </div>
        )}
      </div>

      {/* Grid */}
      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/60">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="text-muted-foreground/60"
            >
              <path d="M13 2L4.09 12.96A1 1 0 0 0 5 14.5h5.5L11 22l8.91-10.96A1 1 0 0 0 19 9.5H13.5L13 2Z" />
            </svg>
          </div>
          <p className="text-base font-medium text-foreground">
            No flash sales right now
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Check back soon — new deals drop regularly.
          </p>
          <Link
            href="/collection"
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:border-primary/40 hover:text-primary"
          >
            Browse full collection &rarr;
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {products.map((product) => {
            const sale = product.flashSales[0];
            const discountPct = Math.round(
              (1 - sale.salePrice / product.markupPrice) * 100,
            );
            return (
              <a
                key={product.id}
                href={`/collection/${product.slug}`}
                className="group rounded-2xl border border-border/60 bg-card overflow-hidden transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
              >
                {/* Image */}
                <div className="relative aspect-square bg-muted/60 overflow-hidden">
                  {product.images[0] ? (
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                    />
                  ) : product.videos[0] ? (
                    <ProductVideoThumbnail src={product.videos[0]} />
                  ) : null}
                  {discountPct > 0 && (
                    <span className="absolute top-2 right-2 rounded-full bg-destructive px-2 py-0.5 text-[10px] font-bold text-destructive-foreground shadow">
                      -{discountPct}%
                    </span>
                  )}
                  {sale.label && (
                    <span className="absolute bottom-2 left-2 rounded-md bg-background/90 px-2 py-0.5 text-[10px] font-medium text-foreground shadow">
                      {sale.label}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="p-3 space-y-1">
                  <p className="text-xs font-medium leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                    {product.name}
                  </p>
                  <div className="flex items-baseline gap-1.5">
                    <p className="text-sm font-bold text-primary">
                      {formatNaira(sale.salePrice)}
                    </p>
                    <p className="text-[11px] text-muted-foreground line-through">
                      {formatNaira(product.markupPrice)}
                    </p>
                  </div>
                  <div className="pt-0.5">
                    <span className="text-[10px] text-muted-foreground/80">
                      Ends in{" "}
                      <FlashSaleCountdown
                        endsAt={sale.endsAt.toISOString()}
                      />
                    </span>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
