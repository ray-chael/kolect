import Image from "next/image";
import { HeroCTA } from "@/components/shared/hero-cta";
import { FlashSaleSection } from "@/components/shared/flash-sale-section";
import { productService } from "@/lib/services/product.service";
import { formatNaira } from "@/lib/types";
import { ProductVideoThumbnail } from "@/components/shared/product-video-thumbnail";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ade's Kolekt — Pre-Order & Installment Platform",
  description:
    "Shop curated items at unbeatable prices. Pay small small at your pace, and we deliver to your door. Pre-order and installment shopping in Nigeria.",
};

export default async function HomePage() {
  const products = await productService.getAll();
  const featured = products.slice(0, 6);
  const flashSaleProducts = products.filter(
    (p) => (p.flashSales?.length ?? 0) > 0,
  );
  const trending = await productService.getTrending(6);

  return (
    <>
      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Layered background depth */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-background to-warm/5" />
          <div className="absolute -right-48 -top-48 h-[640px] w-[640px] rounded-full bg-primary/6 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-warm/8 blur-2xl" />
          {/* Subtle dot grid */}
          <div
            className="absolute inset-0 opacity-[0.035]"
            style={{
              backgroundImage:
                "radial-gradient(circle, currentColor 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-24 md:py-32">
          <div className="max-w-2xl">
            {/* Eyebrow pill */}
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5">
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary"
              />
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                Curated &middot; Affordable &middot; Delivered
              </span>
            </div>

            {/* Headline */}
            <h1 className="font-display text-5xl leading-[1.06] tracking-tight sm:text-6xl md:text-7xl">
              Premium Goods,
              <br />
              <span className="relative inline-block">
                <span className="text-primary">Your Pace</span>
                {/* Decorative underline */}
                <svg
                  aria-hidden="true"
                  className="absolute -bottom-1 left-0 w-full text-primary/35"
                  height="6"
                  viewBox="0 0 200 6"
                  fill="none"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M0 5 Q50 1 100 4 Q150 7 200 3"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>

            <p className="mt-6 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
              Handpicked items at unbeatable prices. Pay a small deposit,
              contribute at your convenience, and we deliver to your door.
            </p>

            {/* CTAs — min 44px height, touch-friendly gap */}
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <a
                href="/collection"
                className="inline-flex h-12 items-center gap-2 rounded-full bg-primary px-7 text-sm font-semibold tracking-wide text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-200 hover:bg-primary/90 active:scale-95"
              >
                Explore Collection
                <svg
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </a>
              <HeroCTA />
            </div>

            {/* Social proof numbers */}
            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-border/40 pt-8">
              {[
                { num: "1,000+", label: "Products delivered" },
                { num: "20%", label: "Deposit to start" },
                { num: "₦2k+", label: "Min. top-up" },
              ].map(({ num, label }) => (
                <div key={label}>
                  <p className="font-display text-2xl font-bold tabular-nums text-foreground">
                    {num}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust Bar ─────────────────────────────────────────── */}
      <section
        aria-label="Why shop with us"
        className="border-y border-border/40 bg-muted/20"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-5">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              {
                title: "Secure Payments",
                sub: "100% payment protection",
                icon: (
                  <svg
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                ),
              },
              {
                title: "Nationwide Delivery",
                sub: "Delivered to your door",
                icon: (
                  <svg
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 18H3c-.6 0-1-.4-1-1V7c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v3" />
                    <path d="M14 9h4l4 4v4h-2" />
                    <circle cx="17" cy="18" r="2" />
                    <path d="M7 18H5" />
                    <circle cx="7" cy="18" r="2" />
                  </svg>
                ),
              },
              {
                title: "Flexible Installments",
                sub: "Pay ₦2,000+ anytime",
                icon: (
                  <svg
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                ),
              },
              {
                title: "Quality Guaranteed",
                sub: "Handpicked, vetted items",
                icon: (
                  <svg
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                ),
              },
            ].map(({ icon, title, sub }) => (
              <div key={title} className="flex items-start gap-3 py-1">
                <div
                  aria-hidden="true"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
                >
                  {icon}
                </div>
                <div>
                  <p className="text-sm font-semibold">{title}</p>
                  <p className="text-xs text-muted-foreground">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────────── */}
      <section className="bg-muted/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-14 sm:py-20">
          <div className="mb-12 text-center">
            <p className="mb-2 text-xs uppercase tracking-[0.25em] text-primary">
              The Process
            </p>
            <h2 className="font-display text-3xl tracking-tight md:text-4xl">
              How &ldquo;Pay Small Small&rdquo; Works
            </h2>
          </div>

          <div className="relative grid grid-cols-2 gap-6 md:grid-cols-4">
            {/* Dashed connector — desktop only */}
            <div
              aria-hidden="true"
              className="absolute left-[12.5%] right-[12.5%] top-9 hidden h-px border-t-2 border-dashed border-primary/15 md:block"
            />

            {[
              {
                step: "01",
                title: "Choose Your Item",
                desc: "Browse our curated collection of premium goods",
                icon: (
                  <svg
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                    <line x1="3" x2="21" y1="6" y2="6" />
                    <path d="M16 10a4 4 0 0 1-8 0" />
                  </svg>
                ),
              },
              {
                step: "02",
                title: "Pay 20% Deposit",
                desc: "Lock in your price with a non-refundable deposit",
                icon: (
                  <svg
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect width="20" height="14" x="2" y="5" rx="2" />
                    <line x1="2" x2="22" y1="10" y2="10" />
                  </svg>
                ),
              },
              {
                step: "03",
                title: "Top Up Flexibly",
                desc: "Make payments of ₦2,000+ anytime within the lock period",
                icon: (
                  <svg
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                ),
              },
              {
                step: "04",
                title: "We Deliver",
                desc: "Once fully paid, we procure and deliver to your door",
                icon: (
                  <svg
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 18H3c-.6 0-1-.4-1-1V7c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v3" />
                    <path d="M14 9h4l4 4v4h-2" />
                    <circle cx="17" cy="18" r="2" />
                    <path d="M7 18H5" />
                    <circle cx="7" cy="18" r="2" />
                  </svg>
                ),
              },
            ].map((item) => (
              <div
                key={item.step}
                className="group relative z-10 flex flex-col items-center text-center"
              >
                {/* Icon tile */}
                <div className="mb-4 flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-2xl border border-border/60 bg-card text-primary shadow-sm transition-all duration-300 group-hover:border-primary/30 group-hover:bg-primary/5 group-hover:shadow-md">
                  {item.icon}
                </div>
                <span className="mb-1 text-[10px] font-bold uppercase tracking-[0.22em] text-primary/50">
                  {item.step}
                </span>
                <h3 className="text-sm font-semibold tracking-tight sm:text-base">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Flash Sales ───────────────────────────────────────── */}
      <FlashSaleSection products={flashSaleProducts} />

      {/* ── Trending Now ──────────────────────────────────────── */}
      {trending.length > 0 && (
        <section className="border-t border-border/40">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-14 sm:py-20">
            <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="mb-2 text-xs uppercase tracking-[0.25em] text-warm">
                  Popular
                </p>
                <h2 className="font-display text-3xl tracking-tight md:text-4xl">
                  Trending Now
                </h2>
              </div>
              <a
                href="/collection?sort=most-viewed"
                className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
              >
                View all &rarr;
              </a>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {trending.map((product) => (
                <a
                  key={product.id}
                  href={`/collection/${product.slug}`}
                  className="group overflow-hidden rounded-2xl border border-border/60 bg-card transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-muted/60">
                    {product.images[0] ? (
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    ) : product.videos?.[0] ? (
                      <ProductVideoThumbnail src={product.videos[0]} />
                    ) : null}
                    {product.flashSales[0] && (
                      <span className="absolute left-3 top-3 rounded-full bg-destructive px-2.5 py-1 text-xs font-bold text-destructive-foreground shadow-md">
                        {product.flashSales[0].label}
                      </span>
                    )}
                    <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-background/80 backdrop-blur-sm px-2 py-1 text-xs font-medium text-muted-foreground">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      {product.viewCount}
                    </span>
                  </div>
                  <div className="p-5">
                    <h3 className="font-semibold tracking-tight transition-colors group-hover:text-primary">
                      {product.name}
                    </h3>
                    {product.flashSales[0] ? (
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
                    {product.category && (
                      <span className="mt-2 inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                        {product.category.name}
                      </span>
                    )}
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Featured Products ─────────────────────────────────── */}
      {featured.length > 0 && (
        <section className="border-t border-border/40">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-14 sm:py-20">
            <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="mb-2 text-xs uppercase tracking-[0.25em] text-primary">
                  Featured
                </p>
                <h2 className="font-display text-3xl tracking-tight md:text-4xl">
                  Our Collection
                </h2>
              </div>
              <a
                href="/collection"
                className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
              >
                View all &rarr;
              </a>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((product) => (
                <a
                  key={product.id}
                  href={`/collection/${product.slug}`}
                  className="group overflow-hidden rounded-2xl border border-border/60 bg-card transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5"
                >
                  {/* Image — edge-to-edge, 4:3 ratio */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-muted/60">
                    {product.images[0] ? (
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        loading="lazy"
                      />
                    ) : product.videos[0] ? (
                      <ProductVideoThumbnail src={product.videos[0]} />
                    ) : null}
                    {/* Flash sale badge */}
                    {product.flashSales?.[0] && (
                      <span className="absolute left-3 top-3 rounded-full bg-destructive px-2.5 py-1 text-xs font-bold text-destructive-foreground shadow-md">
                        {product.flashSales[0].label}
                      </span>
                    )}
                  </div>

                  {/* Card body */}
                  <div className="p-5">
                    <h3 className="line-clamp-1 font-semibold tracking-tight transition-colors duration-200 group-hover:text-primary">
                      {product.name}
                    </h3>

                    {product.flashSales?.[0] ? (
                      <div className="mt-2 flex items-baseline gap-2">
                        <p className="text-lg font-bold text-primary">
                          {formatNaira(product.flashSales[0].salePrice)}
                        </p>
                        <p className="text-sm text-muted-foreground line-through">
                          {formatNaira(product.markupPrice)}
                        </p>
                        <span className="ml-auto rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive">
                          -
                          {Math.round(
                            (1 -
                              product.flashSales[0].salePrice /
                                product.markupPrice) *
                              100,
                          )}
                          %
                        </span>
                      </div>
                    ) : (
                      <p className="mt-2 text-lg font-bold text-foreground">
                        {formatNaira(product.markupPrice)}
                      </p>
                    )}

                    <div className="mt-3 flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        From{" "}
                        <span className="font-medium text-primary">
                          {formatNaira(
                            Math.round(
                              (product.flashSales?.[0]?.salePrice ??
                                product.markupPrice) * 0.2,
                            ),
                          )}
                        </span>{" "}
                        deposit
                      </p>
                      <span
                        aria-hidden="true"
                        className="inline-flex items-center gap-1 rounded-full bg-primary/8 px-2.5 py-1 text-[10px] font-semibold text-primary transition-colors group-hover:bg-primary/15"
                      >
                        View
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="10"
                          height="10"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
