"use client";

import { useEffect, useRef } from "react";
import { recordProductView } from "@/actions/product-views";
import { recordRecentlyViewed } from "./recently-viewed";

/**
 * Invisible component that fires a single view-tracking call
 * when mounted on a product detail page, and saves to recently-viewed.
 */
export function ProductViewTracker({
  productId,
  slug,
  name,
  image,
  video,
  price,
}: {
  productId: string;
  slug: string;
  name: string;
  image: string;
  video?: string;
  price: number;
}) {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    recordProductView(productId);
    recordRecentlyViewed({ id: productId, slug, name, image, video, price });
  }, [productId, slug, name, image, video, price]);

  return null;
}
