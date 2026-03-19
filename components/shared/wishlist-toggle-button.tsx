"use client";

import { Heart } from "lucide-react";
import { useWishlist } from "@/contexts/wishlist-context";

export function WishlistToggleButton({ productId }: { productId: string }) {
  const { isWishlisted, toggle } = useWishlist();
  const wishlisted = isWishlisted(productId);

  return (
    <button
      onClick={() => toggle(productId)}
      className={`flex h-10 w-10 items-center justify-center rounded-full border transition-colors ${
        wishlisted
          ? "border-destructive/30 bg-destructive/10 text-destructive"
          : "border-border/60 text-muted-foreground hover:text-destructive hover:border-destructive/30"
      }`}
      aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
    >
      <Heart className={`h-5 w-5 ${wishlisted ? "fill-current" : ""}`} />
    </button>
  );
}
