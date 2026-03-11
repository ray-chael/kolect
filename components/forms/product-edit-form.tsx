"use client";

import { useTransition, useState, useEffect } from "react";
import { updateProduct } from "@/actions/admin";
import { getCategoriesFlat } from "@/actions/categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CloudinaryMediaManager } from "@/components/forms/cloudinary-media-manager";
import { RichTextEditor } from "@/components/forms/rich-text-editor";
import { ProductOptionsBuilder } from "@/components/forms/product-options-builder";
import { toast } from "sonner";
import type { ProductCustomField } from "@/lib/types";

interface Product {
  id: string;
  name: string;
  description: string | null;
  images: string[];
  videos: string[];
  colors: string[];
  sizes: string[];
  customFields: ProductCustomField[];
  originalCost: number;
  markupPrice: number;
  moq: number;
  isPreorder: boolean;
  expectedProcurementAt: Date | null;
  priceLockDays: number;
  categoryId: string | null;
  category: { id: string; name: string } | null;
}

interface CategoryOption {
  id: string;
  name: string;
  parent: { id: string; name: string } | null;
}

export function ProductEditForm({ product }: { product: Product }) {
  const [isPending, startTransition] = useTransition();
  const [images, setImages] = useState<string[]>(product.images);
  const [videos, setVideos] = useState<string[]>(product.videos ?? []);
  const [description, setDescription] = useState(product.description ?? "");
  const [isPreorder, setIsPreorder] = useState(product.isPreorder);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [categoryId, setCategoryId] = useState(product.categoryId ?? "");
  const [colors, setColors] = useState<string[]>(product.colors ?? []);
  const [sizes, setSizes] = useState<string[]>(product.sizes ?? []);
  const [customFields, setCustomFields] = useState<ProductCustomField[]>(
    product.customFields ?? [],
  );

  useEffect(() => {
    getCategoriesFlat().then((result) => {
      if (result.success && result.data) {
        setCategories(result.data as CategoryOption[]);
      }
    });
  }, []);

  function handleSubmit(formData: FormData) {
    for (const url of images) {
      formData.append("images", url);
    }
    for (const url of videos) {
      if (url.trim()) formData.append("videos", url.trim());
    }
    formData.set("description", description);
    formData.set("isPreorder", String(isPreorder));
    formData.set("categoryId", categoryId);
    formData.set(
      "colors",
      JSON.stringify(colors.map((item) => item.trim()).filter(Boolean)),
    );
    formData.set(
      "sizes",
      JSON.stringify(sizes.map((item) => item.trim()).filter(Boolean)),
    );
    formData.set(
      "customFields",
      JSON.stringify(
        customFields
          .map((field) => ({
            ...field,
            label: field.label.trim(),
            options: field.options
              .map((option) => ({
                label: option.label.trim(),
                value: option.value.trim(),
              }))
              .filter((option) => option.label && option.value),
          }))
          .filter((field) => field.label),
      ),
    );

    startTransition(async () => {
      const result = await updateProduct(product.id, formData);
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      toast.success("Product updated!");
      window.location.href = "/admin/products";
    });
  }

  return (
    <form action={handleSubmit} className="space-y-8">
      <div className="rounded-2xl border border-border/60 bg-card p-6 space-y-5">
        <h2 className="font-display text-xl tracking-tight">Basic Info</h2>

        <div className="space-y-2">
          <Label htmlFor="name">Product Name</Label>
          <Input
            id="name"
            name="name"
            defaultValue={product.name}
            required
            className="rounded-xl"
          />
        </div>

        <div className="space-y-2">
          <Label>Description</Label>
          <RichTextEditor value={description} onChange={setDescription} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="categorySelect">Category</Label>
                  <select
            title="Select a category for this product (optional)"
            id="categorySelect"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="flex h-10 w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="">No category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.parent ? `${cat.parent.name} → ${cat.name}` : cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-6 space-y-5">
        <h2 className="font-display text-xl tracking-tight">Images</h2>
        <CloudinaryMediaManager
          value={images}
          onChange={setImages}
          resourceType="image"
          maxFiles={5}
        />
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl tracking-tight">Videos</h2>
          <span className="text-xs text-muted-foreground">{videos.length}/2</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Upload up to 2 product videos to Cloudinary, or reuse one already in your gallery.
        </p>
        <CloudinaryMediaManager
          value={videos}
          onChange={setVideos}
          resourceType="video"
          maxFiles={2}
        />
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-6 space-y-5">
        <h2 className="font-display text-xl tracking-tight">Pricing</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="originalCost">Original Cost (kobo)</Label>
            <Input
              id="originalCost"
              name="originalCost"
              type="number"
              defaultValue={product.originalCost}
              min={100}
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="markupPrice">Selling Price (kobo)</Label>
            <Input
              id="markupPrice"
              name="markupPrice"
              type="number"
              defaultValue={product.markupPrice}
              min={100}
              className="rounded-xl"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="moq">Minimum Order Quantity</Label>
            <Input
              id="moq"
              name="moq"
              type="number"
              defaultValue={product.moq}
              min={1}
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="priceLockDays">Price Lock (days)</Label>
            <Input
              id="priceLockDays"
              name="priceLockDays"
              type="number"
              defaultValue={product.priceLockDays}
              min={1}
              max={180}
              className="rounded-xl"
            />
          </div>
        </div>
      </div>

      <ProductOptionsBuilder
        colors={colors}
        sizes={sizes}
        customFields={customFields}
        onColorsChange={setColors}
        onSizesChange={setSizes}
        onCustomFieldsChange={setCustomFields}
      />

      <div className="rounded-2xl border border-border/60 bg-card p-6 space-y-5">
        <h2 className="font-display text-xl tracking-tight">Pre-order</h2>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isPreorder}
            onChange={(e) => setIsPreorder(e.target.checked)}
            className="h-4 w-4 rounded border-border accent-primary"
          />
          <span className="text-sm">This is a pre-order product</span>
        </label>

        {isPreorder && (
          <div className="space-y-2">
            <Label htmlFor="expectedProcurementAt">
              Expected Procurement Date
            </Label>
            <Input
              id="expectedProcurementAt"
              name="expectedProcurementAt"
              type="date"
              defaultValue={
                product.expectedProcurementAt
                  ? new Date(product.expectedProcurementAt)
                      .toISOString()
                      .split("T")[0]
                  : ""
              }
              className="rounded-xl"
            />
          </div>
        )}
      </div>

      <Button
        type="submit"
        disabled={isPending}
        className="h-12 w-full rounded-full font-medium tracking-wide shadow-lg shadow-primary/20"
      >
        {isPending ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  );
}
