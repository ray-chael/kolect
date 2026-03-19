"use client";

import { Heart } from "lucide-react";
import Link from "next/link";
import { useWishlist } from "@/contexts/wishlist-context";

export function WishlistIcon() {
  const { itemCount } = useWishlist();

  return (
    <Link
      href="/wishlist"
      className="relative flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:text-primary transition-colors"
      aria-label="Wishlist"
    >
      <Heart className="h-5 w-5" />
      {itemCount > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
          {itemCount > 99 ? "99+" : itemCount}
        </span>
      )}
    </Link>
  );
}
