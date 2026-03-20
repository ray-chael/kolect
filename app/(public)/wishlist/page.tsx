"use client";

import { useWishlist } from "@/contexts/wishlist-context";
import { useCart } from "@/contexts/cart-context";
import { formatNaira } from "@/lib/types";
import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingCart, Loader2 } from "lucide-react";
import { SignInLink } from "@/components/shared/sign-in-link";

export default function WishlistPage() {
  const { items, loading, toggle } = useWishlist();
  const { addItem } = useCart();

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12">
        <h1 className="font-display text-3xl tracking-tight mb-8">Wishlist</h1>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  const validItems = items.filter((i) => i.product.name);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12">
        <h1 className="font-display text-3xl tracking-tight mb-8">Wishlist</h1>
        <div className="py-24 text-center space-y-4">
          <Heart className="h-16 w-16 text-muted-foreground/40 mx-auto" />
          <p className="text-muted-foreground">Your wishlist is empty</p>
          <Link
            href="/collection"
            className="inline-block rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Browse Collection
          </Link>
        </div>
      </div>
    );
  }

  // Guest users have items but no product details
  if (items.length > 0 && validItems.length === 0) {
    return (
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12">
        <h1 className="font-display text-3xl tracking-tight mb-8">Wishlist</h1>
        <div className="py-24 text-center space-y-4">
          <Heart className="h-16 w-16 text-muted-foreground/40 mx-auto" />
          <p className="text-muted-foreground">
            You have {items.length} saved item{items.length !== 1 ? "s" : ""}.
          </p>
          <p className="text-sm text-muted-foreground">
            Sign in to view your wishlist details.
          </p>
          <SignInLink className="inline-block rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
            Sign In
          </SignInLink>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 sm:py-12">
      <h1 className="font-display text-3xl tracking-tight mb-8">
        Wishlist{" "}
        <span className="text-lg text-muted-foreground font-sans font-normal">
          ({validItems.length})
        </span>
      </h1>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {validItems.map((item) => (
          <div
            key={item.productId}
            className="group rounded-2xl border border-border/60 bg-card p-5 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
          >
            <div className="relative mb-4 aspect-square overflow-hidden rounded-xl bg-muted/60">
              <Link href={`/collection/${item.product.slug}`}>
                {item.product.images[0] ? (
                  <Image
                    src={item.product.images[0]}
                    alt={item.product.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    No image
                  </div>
                )}
              </Link>

              {/* Remove from wishlist */}
              <button
                onClick={() => toggle(item.productId)}
                className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm text-destructive shadow-sm hover:bg-background transition-colors"
                aria-label="Remove from wishlist"
              >
                <Heart className="h-4 w-4 fill-current" />
              </button>
            </div>

            <Link
              href={`/collection/${item.product.slug}`}
              className="font-semibold tracking-tight transition-colors duration-300 group-hover:text-primary line-clamp-1"
            >
              {item.product.name}
            </Link>

            <p className="mt-1 text-lg font-bold text-foreground">
              {formatNaira(item.product.markupPrice)}
            </p>

            <button
              onClick={() => addItem(item.productId, 1)}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-border/60 px-4 py-2 text-sm font-medium text-foreground hover:border-primary/40 hover:text-primary transition-colors"
            >
              <ShoppingCart className="h-4 w-4" />
              Add to Cart
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
