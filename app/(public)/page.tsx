import Image from "next/image";
import { HeroCTA } from "@/components/shared/hero-cta";
import { FlashSaleSection } from "@/components/shared/flash-sale-section";
import { productService } from "@/lib/services/product.service";
import { formatNaira } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const products = await productService.getAll();
  const featured = products.slice(0, 6);
  const flashSaleProducts = products.filter(
    (p) => (p.flashSales?.length ?? 0) > 0,
  );

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden grain">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-warm/5 pointer-events-none" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-24 md:py-36 relative">
          <div className="max-w-3xl">
            <p className="text-sm tracking-[0.2em] uppercase text-primary mb-4">
              Curated &bull; Affordable &bull; Delivered
            </p>
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl leading-[1.05] tracking-tight text-foreground">
              Premium Goods,
              <br />
              <span className="text-primary">Your Pace</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground max-w-xl">
              Handpicked items at unbeatable prices. Pay a small deposit,
              contribute at your convenience, and we deliver to your door.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <a
                href="/products"
                className="inline-flex h-12 items-center rounded-full bg-primary px-8 text-sm font-medium tracking-wide text-primary-foreground hover:bg-primary/90 transition-all duration-300 shadow-lg shadow-primary/20"
              >
                Explore Collection
              </a>
              <HeroCTA />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-t border-border/40 bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-14 sm:py-20">
          <div className="text-center mb-14">
            <p className="text-xs tracking-[0.25em] uppercase text-primary mb-2">
              The Process
            </p>
            <h2 className="font-display text-3xl md:text-4xl tracking-tight">
              How &ldquo;Contribute to Buy&rdquo; Works
            </h2>
          </div>
          <div className="grid gap-8 grid-cols-2 md:grid-cols-4">
            {[
              {
                step: "01",
                title: "Choose Your Item",
                desc: "Browse our curated collection of premium goods",
              },
              {
                step: "02",
                title: "Pay 20% Deposit",
                desc: "Lock in your price with a non-refundable deposit",
              },
              {
                step: "03",
                title: "Top Up Flexibly",
                desc: "Make payments of ₦2,000+ anytime within the lock period",
              },
              {
                step: "04",
                title: "We Deliver",
                desc: "Once fully paid, we procure and deliver to your door",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="group text-center p-6 rounded-2xl hover:bg-card transition-colors duration-300"
              >
                <span className="font-display text-4xl text-primary/20 group-hover:text-primary/40 transition-colors duration-300">
                  {item.step}
                </span>
                <h3 className="mt-2 font-semibold tracking-tight">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Flash Sales */}
      <FlashSaleSection products={flashSaleProducts} />

      {/* Featured Products */}
      {featured.length > 0 && (
        <section className="border-t border-border/40">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-14 sm:py-20">
            <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
              <div>
                <p className="text-xs tracking-[0.25em] uppercase text-primary mb-2">
                  Featured
                </p>
                <h2 className="font-display text-3xl md:text-4xl tracking-tight">
                  Our Collection
                </h2>
              </div>
              <a
                href="/products"
                className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                View all &rarr;
              </a>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((product) => (
                <a
                  key={product.id}
                  href={`/products/${product.slug}`}
                  className="group rounded-2xl border border-border/60 bg-card p-5 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
                >
                  <div className="mb-4 aspect-square rounded-xl bg-muted/60 overflow-hidden relative">
                    {product.images[0] ? (
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="40"
                          height="40"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect width="18" height="18" x="3" y="3" rx="2" />
                          <circle cx="9" cy="9" r="2" />
                          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                        </svg>
                      </div>
                    )}
                    {product.flashSales?.[0] && (
                      <span className="absolute top-2 left-2 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground shadow-sm">
                        {product.flashSales[0].label}
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold tracking-tight group-hover:text-primary transition-colors duration-300">
                    {product.name}
                  </h3>
                  {product.flashSales?.[0] ? (
                    <div className="mt-1 flex items-baseline gap-2">
                      <p className="text-lg font-bold text-primary">
                        {formatNaira(product.flashSales[0].salePrice)}
                      </p>
                      <p className="text-sm text-muted-foreground line-through">
                        {formatNaira(product.markupPrice)}
                      </p>
                    </div>
                  ) : (
                    <p className="mt-1 text-lg font-bold text-foreground">
                      {formatNaira(product.markupPrice)}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    From{" "}
                    {formatNaira(
                      Math.round(
                        (product.flashSales?.[0]?.salePrice ??
                          product.markupPrice) * 0.2,
                      ),
                    )}{" "}
                    deposit
                  </p>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
