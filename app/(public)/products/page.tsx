import { productService } from "@/lib/services/product.service";
import { prisma } from "@/lib/db";
import { ProductsClient } from "@/components/shared/products-client";

export const dynamic = "force-dynamic";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { q, category } = await searchParams;

  const [{ items, total }, categories] = await Promise.all([
    productService.search({
      q: q || undefined,
      categoryId: category || undefined,
      skip: 0,
      take: 12,
    }),
    prisma.category.findMany({
      include: { parent: { select: { id: true, name: true } } },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12">
      <div className="mb-10">
        <p className="text-xs tracking-[0.25em] uppercase text-primary mb-2">
          Browse
        </p>
        <h1 className="font-display text-4xl tracking-tight">Our Collection</h1>
        <p className="mt-2 text-muted-foreground">
          Curated items at unbeatable prices — pre-order or pay in installments
        </p>
      </div>

      <ProductsClient
        initialItems={items}
        total={total}
        categories={categories}
        initialQ={q ?? ""}
        initialCategoryId={category ?? ""}
      />
    </div>
  );
}
