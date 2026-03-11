"use client";

import { useTransition, useState } from "react";
import { createCategory, deleteCategory } from "@/actions/categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  children: { id: string; name: string; slug: string }[];
}

export function CategoryManager({
  categories,
}: {
  categories: Category[];
}) {
  const [isPending, startTransition] = useTransition();
  const [parentId, setParentId] = useState("");

  function handleCreate(formData: FormData) {
    if (parentId) formData.set("parentId", parentId);

    startTransition(async () => {
      const result = await createCategory(formData);
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success("Category created!");
      window.location.reload();
    });
  }

  function handleDelete(categoryId: string, name: string) {
    if (!confirm(`Delete "${name}" and all its subcategories?`)) return;

    startTransition(async () => {
      const result = await deleteCategory(categoryId);
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success("Category deleted");
      window.location.reload();
    });
  }

  return (
    <div className="space-y-8">
      {/* Create form */}
      <div className="rounded-2xl border border-border/60 bg-card p-6 space-y-5">
        <h2 className="font-display text-xl tracking-tight">Add Category</h2>

        <form action={handleCreate} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              required
              placeholder="e.g. Electronics"
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="parentSelect">Parent Category (optional)</Label>
            <select
                title='Select parent category or leave as "None" for top-level'
              id="parentSelect"
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="flex h-10 w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">None (top-level)</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <Button
            type="submit"
            disabled={isPending}
            className="rounded-full"
          >
            {isPending ? "Creating..." : "Create Category"}
          </Button>
        </form>
      </div>

      {/* Category list */}
      <div className="rounded-2xl border border-border/60 bg-card p-6 space-y-4">
        <h2 className="font-display text-xl tracking-tight">Categories</h2>

        {categories.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">
            No categories yet. Create one above.
          </p>
        ) : (
          <div className="space-y-3">
            {categories.map((cat) => (
              <div key={cat.id} className="space-y-1">
                <div className="flex items-center justify-between rounded-xl bg-muted/30 px-4 py-3">
                  <span className="font-medium">{cat.name}</span>
                  <button
                    type="button"
                    onClick={() => handleDelete(cat.id, cat.name)}
                    disabled={isPending}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                    title="Delete category"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                {cat.children.length > 0 && (
                  <div className="ml-6 space-y-1">
                    {cat.children.map((child) => (
                      <div
                        key={child.id}
                        className="flex items-center justify-between rounded-xl bg-muted/20 px-4 py-2.5"
                      >
                        <span className="text-sm text-muted-foreground">
                          {child.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDelete(child.id, child.name)}
                          disabled={isPending}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                          title="Delete subcategory"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
