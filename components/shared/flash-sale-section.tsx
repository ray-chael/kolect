import Image from "next/image";
import { FlashSaleCountdown } from "./flash-sale-countdown";
import { formatNaira } from "@/lib/types";
import { ProductVideoThumbnail } from "./product-video-thumbnail";

type SaleProductCard = {
  id: string;
  name: string;
  slug: string;
  images: string[];
  videos: string[];
  markupPrice: number;
  flashSales: Array<{
    salePrice: number;
    label: string;
    endsAt: Date;
  }>;
};

export function FlashSaleSection({
  products,
}: {
  products: SaleProductCard[];
}) {
  if (products.length === 0) return null;

  // Use the earliest sale end time for the shared countdown
  const earliestEndsAt = products
    .map((p) => p.flashSales[0].endsAt.getTime())
    .sort((a, b) => a - b)[0];
  const endsAtIso = new Date(earliestEndsAt).toISOString();

  return (
    <section className="border-t border-border/40 bg-destructive/[0.03]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-5 sm:py-7">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 rounded-full bg-destructive px-3 py-1.5 shadow-sm">
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
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <span className="text-[10px] uppercase tracking-widest">
                Ends in
              </span>
              <span className="text-foreground">
                <FlashSaleCountdown endsAt={endsAtIso} />
              </span>
            </div>
          </div>
          <a
            href="/flash-sales"
            className="text-xs font-medium text-primary hover:text-primary/80 transition-colors whitespace-nowrap"
          >
            See All &rarr;
          </a>
        </div>

        {/* Horizontal scroll row */}
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:-mx-6 sm:px-6 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {products.map((product) => {
            const sale = product.flashSales[0];
            const discountPct = Math.round(
              (1 - sale.salePrice / product.markupPrice) * 100,
            );
            return (
              <a
                key={product.id}
                href={`/collection/${product.slug}`}
                className="group flex-shrink-0 w-36 sm:w-40 snap-start rounded-2xl border border-border/60 bg-card overflow-hidden transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
              >
                {/* Image */}
                <div className="relative aspect-square bg-muted/60 overflow-hidden">
                  {product.images[0] ? (
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="160px"
                    />
                  ) : product.videos[0] ? (
                    <ProductVideoThumbnail src={product.videos[0]} />
                  ) : null}
                  {/* Discount badge */}
                  {discountPct > 0 && (
                    <span className="absolute top-2 right-2 rounded-full bg-destructive px-2 py-0.5 text-[10px] font-bold text-destructive-foreground shadow">
                      -{discountPct}%
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="p-2.5 space-y-0.5">
                  <p className="text-[11px] font-medium leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                    {product.name}
                  </p>
                  <p className="text-sm font-bold text-primary">
                    {formatNaira(sale.salePrice)}
                  </p>
                  <p className="text-[10px] text-muted-foreground line-through">
                    {formatNaira(product.markupPrice)}
                  </p>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
