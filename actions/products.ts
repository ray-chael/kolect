"use server";

import { productService } from "@/lib/services/product.service";

export async function fetchProductsAction(options: {
  q?: string;
  categoryId?: string;
  skip: number;
  take: number;
}) {
  return productService.search(options);
}
