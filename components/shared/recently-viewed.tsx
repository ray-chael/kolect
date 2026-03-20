"use client";

import { useSyncExternalStore } from "react";
import Image from "next/image";
import { formatNaira } from "@/lib/types";

const STORAGE_KEY = "recently-viewed";
const MAX_ITEMS = 8;

type RecentProduct = {
  id: string;
  slug: string;
  name: string;
  image: string;
  price: number;
};

/** Save a product to the recently-viewed list in localStorage. */
export function recordRecentlyViewed(product: RecentProduct) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list: RecentProduct[] = raw ? JSON.parse(raw) : [];
    const filtered = list.filter((p) => p.id !== product.id);
    filtered.unshift(product);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(filtered.slice(0, MAX_ITEMS)),
    );
  } catch {
    // localStorage unavailable or quota exceeded — ignore
  }
}

function getSnapshot(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? "[]";
  } catch {
    return "[]";
  }
}

function getServerSnapshot(): string {
  return "[]";
}

function subscribe(callback: () => void): () => void {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

/** Display a "Recently Viewed" strip. */
export function RecentlyViewed({
  excludeProductId,
}: {
  excludeProductId?: string;
}) {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const allProducts: RecentProduct[] = JSON.parse(raw);
  const products = excludeProductId
    ? allProducts.filter((p) => p.id !== excludeProductId)
    : allProducts;

  if (products.length === 0) return null;

  return (
    <section className="border-t border-border/40">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
        <h2 className="mb-5 text-xs uppercase tracking-[0.25em] text-muted-foreground">
          Recently Viewed
        </h2>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {products.map((p) => (
            <a
              key={p.id}
              href={`/collection/${p.slug}`}
              className="group flex-none w-36 rounded-xl border border-border/60 bg-card overflow-hidden transition-all hover:border-primary/30 hover:shadow-md"
            >
              <div className="relative aspect-square bg-muted/60">
                {p.image ? (
                  <Image
                    src={p.image}
                    alt={p.name}
                    fill
                    className="object-cover"
                    sizes="144px"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                    No image
                  </div>
                )}
              </div>
              <div className="p-2.5">
                <p className="truncate text-xs font-medium group-hover:text-primary transition-colors">
                  {p.name}
                </p>
                <p className="mt-0.5 text-xs font-bold">
                  {formatNaira(p.price)}
                </p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
