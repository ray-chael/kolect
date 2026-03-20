"use client";

import { useCart } from "@/contexts/cart-context";
import { formatNaira } from "@/lib/types";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingBag, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SignInLink } from "@/components/shared/sign-in-link";

export default function CartPage() {
  const { items, loading, updateQuantity, removeItem, clearAll } = useCart();

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-12">
        <h1 className="font-display text-3xl tracking-tight mb-8">Your Cart</h1>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  // Filter out guest-mode items that have no product data loaded
  const validItems = items.filter((i) => i.product.name);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-12">
        <h1 className="font-display text-3xl tracking-tight mb-8">Your Cart</h1>
        <div className="py-24 text-center space-y-4">
          <ShoppingBag className="h-16 w-16 text-muted-foreground/40 mx-auto" />
          <p className="text-muted-foreground">Your cart is empty</p>
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

  // Guest users have items but no product details - prompt to sign in
  if (items.length > 0 && validItems.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-12">
        <h1 className="font-display text-3xl tracking-tight mb-8">Your Cart</h1>
        <div className="py-24 text-center space-y-4">
          <ShoppingBag className="h-16 w-16 text-muted-foreground/40 mx-auto" />
          <p className="text-muted-foreground">
            You have {items.length} item{items.length !== 1 ? "s" : ""} in your
            cart.
          </p>
          <p className="text-sm text-muted-foreground">
            Sign in to view your cart details and checkout.
          </p>
          <SignInLink className="inline-block rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
            Sign In
          </SignInLink>
        </div>
      </div>
    );
  }

  const subtotal = validItems.reduce(
    (sum, i) => sum + i.product.markupPrice * i.quantity,
    0,
  );

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 sm:py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl tracking-tight">Your Cart</h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => clearAll()}
          className="text-muted-foreground hover:text-destructive text-xs"
        >
          <Trash2 className="h-3.5 w-3.5 mr-1" />
          Clear All
        </Button>
      </div>

      <div className="space-y-4">
        {validItems.map((item) => (
          <div
            key={item.productId}
            className="flex gap-4 rounded-2xl border border-border/60 bg-card p-4 transition-all"
          >
            {/* Image */}
            <Link
              href={`/collection/${item.product.slug}`}
              className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-muted/60"
            >
              {item.product.images[0] ? (
                <Image
                  src={item.product.images[0]}
                  alt={item.product.name}
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                  No img
                </div>
              )}
            </Link>

            {/* Info */}
            <div className="flex flex-1 flex-col justify-between min-w-0">
              <div>
                <Link
                  href={`/collection/${item.product.slug}`}
                  className="font-semibold tracking-tight hover:text-primary transition-colors line-clamp-1"
                >
                  {item.product.name}
                </Link>
                <p className="text-sm font-bold text-foreground mt-0.5">
                  {formatNaira(item.product.markupPrice)}
                </p>
              </div>

              <div className="flex items-center justify-between mt-2">
                {/* Quantity controls */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() =>
                      updateQuantity(item.productId, item.quantity - 1)
                    }
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 text-muted-foreground hover:text-foreground hover:border-border transition-colors"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-8 text-center text-sm font-medium tabular-nums">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() =>
                      updateQuantity(item.productId, item.quantity + 1)
                    }
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 text-muted-foreground hover:text-foreground hover:border-border transition-colors"
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <p className="text-sm font-bold text-primary tabular-nums">
                    {formatNaira(item.product.markupPrice * item.quantity)}
                  </p>
                  <button
                    onClick={() => removeItem(item.productId)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                    aria-label="Remove item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-8 rounded-2xl border border-border/60 bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-muted-foreground">
            Subtotal ({validItems.length} item
            {validItems.length !== 1 ? "s" : ""})
          </span>
          <span className="text-lg font-bold">{formatNaira(subtotal)}</span>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Delivery fees are calculated at checkout for each item.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/collection"
            className="flex-1 flex items-center justify-center rounded-full border border-border/60 px-6 py-2.5 text-sm font-medium text-foreground hover:border-primary/40 hover:text-primary transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
