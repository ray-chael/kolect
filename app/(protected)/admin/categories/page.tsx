import { categoryService } from "@/lib/services/category.service";
import { CategoryManager } from "@/components/forms/category-manager";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = await categoryService.getAll();

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-12">
      <a
        href="/admin"
        className="text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        &larr; Back to Dashboard
      </a>

      <div className="mt-6 mb-8">
        <p className="text-xs tracking-[0.25em] uppercase text-primary mb-2">
          Organize
        </p>
        <h1 className="font-display text-3xl tracking-tight">Categories</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage product categories and subcategories
        </p>
      </div>

      <CategoryManager categories={categories} />
    </div>
  );
}
