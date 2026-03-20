"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import Image from "next/image";
import {
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  X,
  Loader2,
  ShoppingCart,
  Heart,
  Check,
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
  initialSort?: string;
}

function ProductSkeleton() {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-3 sm:p-5 animate-pulse">
      <div className="mb-3 sm:mb-4 aspect-square rounded-xl bg-muted/60" />
      <div className="h-3 sm:h-4 rounded-lg bg-muted/60 w-3/4 mb-2" />
      <div className="h-4 sm:h-5 rounded-lg bg-muted/60 w-2/5 mb-2 sm:mb-3" />
      <div className="h-2.5 sm:h-3 rounded-lg bg-muted/60 w-1/2" />
    </div>
  );
}

const SORT_OPTIONS = [
  { value: "", label: "Newest" },
  { value: "most-viewed", label: "Most Viewed" },
  { value: "price-low", label: "Price: Low → High" },
  { value: "price-high", label: "Price: High → Low" },
] as const;

export function ProductsClient({
  initialItems,
  total,
  categories,
  initialQ = "",
  initialCategoryId = "",
  initialSort = "",
}: ProductsClientProps) {
  const [items, setItems] = useState<ProductItem[]>(initialItems);
  const [currentTotal, setCurrentTotal] = useState(total);
  const [filterPending, startFilterTransition] = useTransition();
  const [loadingMore, setLoadingMore] = useState(false);
  const [q, setQ] = useState(initialQ);
  const [categoryId, setCategoryId] = useState(initialCategoryId);
  const [sort, setSort] = useState(initialSort);
  const [showCatDropdown, setShowCatDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  const skipRef = useRef(initialItems.length);
  const filterRef = useRef({
    q: initialQ,
    categoryId: initialCategoryId,
    sort: initialSort,
  });
  const sentinelRef = useRef<HTMLDivElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const loadingMoreRef = useRef(false);
  const catDropdownRef = useRef<HTMLDivElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  const hasMore = items.length < currentTotal;

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        catDropdownRef.current &&
        !catDropdownRef.current.contains(e.target as Node)
      )
        setShowCatDropdown(false);
      if (
        sortDropdownRef.current &&
        !sortDropdownRef.current.contains(e.target as Node)
      )
        setShowSortDropdown(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

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
        sort: filterRef.current.sort || undefined,
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

  function applyFilter(newQ: string, newCatId: string, newSort: string = sort) {
    filterRef.current = { q: newQ, categoryId: newCatId, sort: newSort };
    startFilterTransition(async () => {
      const { items: fresh, total: freshTotal } = await fetchProductsAction({
        q: newQ || undefined,
        categoryId: newCatId || undefined,
        sort: newSort || undefined,
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
    setShowCatDropdown(false);
    applyFilter(q, value);
  }

  function handleSortChange(value: string) {
    setSort(value);
    setShowSortDropdown(false);
    applyFilter(q, categoryId, value);
  }

  function clearFilters() {
    setQ("");
    setCategoryId("");
    setSort("");
    applyFilter("", "", "");
  }

  const hasActiveFilters = !!(q.trim() || categoryId || sort);
  const { addItem } = useCart();
  const { isWishlisted, toggle: toggleWishlist } = useWishlist();

  const activeCatName =
    categories.find((c) => c.id === categoryId)?.name ?? null;
  const activeSortLabel =
    SORT_OPTIONS.find((o) => o.value === sort)?.label ?? "Newest";

  return (
    <div>
      {/* ── Filter bar ── */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-1.5 rounded-xl border border-input bg-background h-11 sm:h-12 px-2 sm:px-3 focus-within:ring-2 focus-within:ring-ring">
          {/* Search icon + input */}
          <Search className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
          <input
            type="search"
            value={q}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search collection…"
            className="flex-1 min-w-0 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
          />
          {q && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => handleSearchChange("")}
              className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}

          {/* Separator */}
          <div className="h-5 w-px bg-border/60 mx-0.5" />

          {/* Category button */}
          {categories.length > 0 && (
            <div ref={catDropdownRef} className="relative flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowCatDropdown((p) => !p);
                  setShowSortDropdown(false);
                }}
                className={`flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs sm:text-sm font-medium transition-colors hover:bg-muted/60 ${
                  categoryId ? "text-primary" : "text-muted-foreground"
                }`}
                aria-label="Filter by category"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span className="hidden sm:inline max-w-[80px] truncate">
                  {activeCatName ?? "Category"}
                </span>
              </button>
              {showCatDropdown && (
                <div className="absolute right-0 top-full mt-2 z-50 min-w-[180px] max-h-60 overflow-y-auto rounded-xl border border-border/60 bg-card shadow-lg py-1">
                  <button
                    onClick={() => handleCategoryChange("")}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-muted/60 ${
                      !categoryId
                        ? "text-primary font-medium"
                        : "text-foreground"
                    }`}
                  >
                    {!categoryId && <Check className="h-3 w-3" />}
                    All Categories
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => handleCategoryChange(cat.id)}
                      className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-muted/60 ${
                        categoryId === cat.id
                          ? "text-primary font-medium"
                          : "text-foreground"
                      }`}
                    >
                      {categoryId === cat.id && <Check className="h-3 w-3" />}
                      {cat.parent
                        ? `${cat.parent.name} › ${cat.name}`
                        : cat.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Separator */}
          <div className="h-5 w-px bg-border/60 mx-0.5" />

          {/* Sort button */}
          <div ref={sortDropdownRef} className="relative flex-shrink-0">
            <button
              type="button"
              onClick={() => {
                setShowSortDropdown((p) => !p);
                setShowCatDropdown(false);
              }}
              className={`flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs sm:text-sm font-medium transition-colors hover:bg-muted/60 ${
                sort ? "text-primary" : "text-muted-foreground"
              }`}
              aria-label="Sort products"
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
              <span className="hidden sm:inline max-w-[80px] truncate">
                {activeSortLabel}
              </span>
            </button>
            {showSortDropdown && (
              <div className="absolute right-0 top-full mt-2 z-50 min-w-[170px] rounded-xl border border-border/60 bg-card shadow-lg py-1">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleSortChange(opt.value)}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-muted/60 ${
                      sort === opt.value
                        ? "text-primary font-medium"
                        : "text-foreground"
                    }`}
                  >
                    {sort === opt.value && <Check className="h-3 w-3" />}
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Active filters + count */}
        <div className="mt-2 flex items-center gap-2 min-h-[24px]">
          {hasActiveFilters && (
            <>
              {activeCatName && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {activeCatName}
                  <button
                    onClick={() => handleCategoryChange("")}
                    className="hover:text-primary/70"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              )}
              {sort && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {activeSortLabel}
                  <button
                    onClick={() => handleSortChange("")}
                    className="hover:text-primary/70"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              )}
              <button
                onClick={clearFilters}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear all
              </button>
            </>
          )}
          <span className="ml-auto text-xs tabular-nums text-muted-foreground">
            {filterPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin inline-block" />
            ) : (
              `${currentTotal} item${currentTotal !== 1 ? "s" : ""}`
            )}
          </span>
        </div>
      </div>

      {/* ── Grid ── */}
      {filterPending ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3">
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
        <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3">
          {items.map((product) => (
            <a
              key={product.id}
              href={`/collection/${product.slug}`}
              className="group rounded-2xl border border-border/60 bg-card p-3 sm:p-5 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="relative mb-3 sm:mb-4 aspect-square overflow-hidden rounded-xl bg-muted/60">
                {product.images[0] ? (
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 33vw"
                  />
                ) : product.videos[0] ? (
                  <ProductVideoThumbnail src={product.videos[0]} />
                ) : null}
                {product.flashSales[0] && (
                  <span className="absolute left-2 top-2 sm:left-3 sm:top-3 rounded-full bg-destructive px-1.5 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs font-bold text-destructive-foreground shadow-md">
                    {product.flashSales[0].label}
                  </span>
                )}
                {/* Cart & Wishlist buttons — always visible */}
                <div className="absolute right-2 top-2 sm:right-3 sm:top-3 flex flex-col gap-1 sm:gap-1.5">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleWishlist(product.id);
                    }}
                    className={`flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm shadow-sm hover:bg-background transition-colors ${
                      isWishlisted(product.id)
                        ? "text-destructive"
                        : "text-muted-foreground hover:text-destructive"
                    }`}
                    aria-label="Toggle wishlist"
                  >
                    <Heart
                      className={`h-3 w-3 sm:h-4 sm:w-4 ${isWishlisted(product.id) ? "fill-current" : ""}`}
                    />
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      addItem(product.id, 1);
                    }}
                    className="flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm shadow-sm text-muted-foreground hover:text-primary hover:bg-background transition-colors"
                    aria-label="Add to cart"
                  >
                    <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4" />
                  </button>
                </div>
              </div>

              <h3 className="text-xs sm:text-sm font-semibold tracking-tight transition-colors duration-300 group-hover:text-primary line-clamp-1">
                {product.name}
              </h3>

              {product.flashSales[0] ? (
                <div className="mt-0.5 sm:mt-1 flex items-baseline gap-1 sm:gap-2">
                  <p className="text-sm sm:text-lg font-bold text-primary">
                    {formatNaira(product.flashSales[0].salePrice)}
                  </p>
                  <p className="text-[10px] sm:text-sm text-muted-foreground line-through">
                    {formatNaira(product.markupPrice)}
                  </p>
                </div>
              ) : (
                <p className="mt-0.5 sm:mt-1 text-sm sm:text-lg font-bold text-foreground">
                  {formatNaira(product.markupPrice)}
                </p>
              )}

              <div className="mt-1 sm:mt-2 flex flex-wrap gap-1 sm:gap-1.5">
                {product.isPreorder && (
                  <span className="inline-block rounded-full bg-warm/10 px-1.5 sm:px-2.5 py-0.5 text-[10px] sm:text-xs font-medium text-warm">
                    Pre-order
                  </span>
                )}
                {product.category && (
                  <span className="inline-block rounded-full bg-primary/10 px-1.5 sm:px-2.5 py-0.5 text-[10px] sm:text-xs font-medium text-primary">
                    {product.category.name}
                  </span>
                )}
              </div>
              <p className="mt-1 sm:mt-1.5 text-[10px] sm:text-xs text-muted-foreground">
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
        <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <ProductSkeleton key={i} />
          ))}
        </div>
      )}
    </div>
  );
}
