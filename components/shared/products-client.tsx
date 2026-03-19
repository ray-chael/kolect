"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import Image from "next/image";
import {
  Search,
  SlidersHorizontal,
  X,
  Loader2,
  ShoppingCart,
  Heart,
} from "lucide-react";
import { ProductVideoThumbnail } from "./product-video-thumbnail";
import { fetchProductsAction } from "@/actions/products";
import { formatNaira } from "@/lib/types";
import { useCart } from "@/contexts/cart-context";
import { useWishlist } from "@/contexts/wishlist-context";

const PAGE_SIZE = 12;

type ProductItem = {
  id: string;
  slug: string;
  name: string;
  images: string[];
  videos: string[];
  markupPrice: number;
  isPreorder: boolean;
  category: { id: string; name: string } | null;
  flashSales: { salePrice: number; label: string }[];
};

type Category = {
  id: string;
  name: string;
  parent: { id: string; name: string } | null;
};

interface ProductsClientProps {
  initialItems: ProductItem[];
  total: number;
  categories: Category[];
  initialQ?: string;
  initialCategoryId?: string;
}

function ProductSkeleton() {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 animate-pulse">
      <div className="mb-4 aspect-square rounded-xl bg-muted/60" />
      <div className="h-4 rounded-lg bg-muted/60 w-3/4 mb-2" />
      <div className="h-5 rounded-lg bg-muted/60 w-2/5 mb-3" />
      <div className="h-3 rounded-lg bg-muted/60 w-1/2" />
    </div>
  );
}

export function ProductsClient({
  initialItems,
  total,
  categories,
  initialQ = "",
  initialCategoryId = "",
}: ProductsClientProps) {
  const [items, setItems] = useState<ProductItem[]>(initialItems);
  const [currentTotal, setCurrentTotal] = useState(total);
  const [filterPending, startFilterTransition] = useTransition();
  const [loadingMore, setLoadingMore] = useState(false);
  const [q, setQ] = useState(initialQ);
  const [categoryId, setCategoryId] = useState(initialCategoryId);

  const skipRef = useRef(initialItems.length);
  const filterRef = useRef({ q: initialQ, categoryId: initialCategoryId });
  const sentinelRef = useRef<HTMLDivElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const loadingMoreRef = useRef(false);

  const hasMore = items.length < currentTotal;

  // Stable load-more callback via ref so IntersectionObserver can always call the latest
  const doLoadMoreRef = useRef<(() => Promise<void>) | undefined>(undefined);

  async function doLoadMore() {
    if (loadingMoreRef.current || skipRef.current >= currentTotal) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const { items: more, total: newTotal } = await fetchProductsAction({
        q: filterRef.current.q || undefined,
        categoryId: filterRef.current.categoryId || undefined,
        skip: skipRef.current,
        take: PAGE_SIZE,
      });
      setItems((prev) => [...prev, ...more]);
      skipRef.current += more.length;
      setCurrentTotal(newTotal);
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }

  // Keep the ref pointing at the latest version
  doLoadMoreRef.current = doLoadMore;

  // Intersection observer — set up once, calls stable ref
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) doLoadMoreRef.current?.();
      },
      { rootMargin: "400px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  function applyFilter(newQ: string, newCatId: string) {
    filterRef.current = { q: newQ, categoryId: newCatId };
    startFilterTransition(async () => {
      const { items: fresh, total: freshTotal } = await fetchProductsAction({
        q: newQ || undefined,
        categoryId: newCatId || undefined,
        skip: 0,
        take: PAGE_SIZE,
      });
      setItems(fresh);
      setCurrentTotal(freshTotal);
      skipRef.current = fresh.length;
    });
  }

  function handleSearchChange(value: string) {
    setQ(value);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => applyFilter(value, categoryId), 350);
  }

  function handleCategoryChange(value: string) {
    setCategoryId(value);
    applyFilter(q, value);
  }

  function clearFilters() {
    setQ("");
    setCategoryId("");
    applyFilter("", "");
  }

  const hasActiveFilters = !!(q.trim() || categoryId);
  const { addItem } = useCart();
  const { isWishlisted, toggle: toggleWishlist } = useWishlist();

  return (
    <div>
      {/* ── Filter bar ── */}
      <div className="mb-8 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={q}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search products…"
            className="h-10 w-full rounded-xl border border-input bg-background pl-10 pr-10 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          {q && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => handleSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Category */}
        {categories.length > 0 && (
          <div className="relative">
            <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <select
              aria-label="Filter by category"
              value={categoryId}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="h-10 appearance-none rounded-xl border border-input bg-background pl-9 pr-8 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.parent ? `${cat.parent.name} › ${cat.name}` : cat.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex h-10 items-center gap-1.5 rounded-xl border border-border/60 px-4 text-sm text-muted-foreground transition-colors hover:border-border hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </button>
        )}

        {/* Count */}
        <span className="ml-auto text-xs tabular-nums text-muted-foreground">
          {filterPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin inline-block" />
          ) : (
            `${currentTotal} product${currentTotal !== 1 ? "s" : ""}`
          )}
        </span>
      </div>

      {/* ── Grid ── */}
      {filterPending ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProductSkeleton key={i} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="py-24 text-center">
          <p className="text-muted-foreground">No products found.</p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-3 text-sm text-primary hover:text-primary/80 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((product) => (
            <a
              key={product.id}
              href={`/products/${product.slug}`}
              className="group rounded-2xl border border-border/60 bg-card p-5 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="relative mb-4 aspect-square overflow-hidden rounded-xl bg-muted/60">
                {product.images[0] ? (
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                ) : product.videos[0] ? (
                  <ProductVideoThumbnail src={product.videos[0]} />
                ) : null}
                {product.flashSales[0] && (
                  <span className="absolute left-3 top-3 rounded-full bg-destructive px-2.5 py-1 text-xs font-bold text-destructive-foreground shadow-md">
                    {product.flashSales[0].label}
                  </span>
                )}
                {/* Cart & Wishlist buttons */}
                <div className="absolute right-3 top-3 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleWishlist(product.id);
                    }}
                    className={`flex h-9 w-9 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm shadow-sm hover:bg-background transition-colors ${
                      isWishlisted(product.id)
                        ? "text-destructive"
                        : "text-muted-foreground hover:text-destructive"
                    }`}
                    aria-label="Toggle wishlist"
                  >
                    <Heart
                      className={`h-4 w-4 ${isWishlisted(product.id) ? "fill-current" : ""}`}
                    />
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      addItem(product.id, 1);
                    }}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm shadow-sm text-muted-foreground hover:text-primary hover:bg-background transition-colors"
                    aria-label="Add to cart"
                  >
                    <ShoppingCart className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <h3 className="font-semibold tracking-tight transition-colors duration-300 group-hover:text-primary">
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

              <div className="mt-2 flex flex-wrap gap-1.5">
                {product.isPreorder && (
                  <span className="inline-block rounded-full bg-warm/10 px-2.5 py-0.5 text-xs font-medium text-warm">
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

      {/* Sentinel — triggers IntersectionObserver when scrolled into view */}
      {hasMore && !filterPending && (
        <div ref={sentinelRef} className="mt-12 flex justify-center">
          <button
            onClick={() => doLoadMoreRef.current?.()}
            disabled={loadingMore}
            className="flex h-11 items-center gap-2 rounded-full border border-border/60 px-8 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loadingMore ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading…
              </>
            ) : (
              "Load more"
            )}
          </button>
        </div>
      )}

      {/* Append skeleton rows while loading more */}
      {loadingMore && (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <ProductSkeleton key={i} />
          ))}
        </div>
      )}
    </div>
  );
}
