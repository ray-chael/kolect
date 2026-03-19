"use server";

import { productService } from "@/lib/services/product.service";

export async function fetchProductsAction(options: {
  q?: string;
  categoryId?: string;
  sort?: string;
  skip: number;
  take: number;
}) {
  return productService.search(options);
}
