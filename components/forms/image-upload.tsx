"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import Image from "next/image";

interface ImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  maxFiles?: number;
}

export function ImageUpload({
  value,
  onChange,
  maxFiles = 5,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;

      if (value.length + files.length > maxFiles) {
        toast.warning(`Maximum ${maxFiles} images allowed`);
        return;
      }

      setUploading(true);
      const newUrls: string[] = [];

      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);

        try {
          const res = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          if (!res.ok) {
            const data = await res.json();
            toast.error(data.error ?? "Upload failed");
            continue;
          }

          const data = await res.json();
          newUrls.push(data.url);
        } catch {
          toast.error("Upload failed");
        }
      }

      if (newUrls.length > 0) {
        onChange([...value, ...newUrls]);
        toast.success(
          `${newUrls.length} image${newUrls.length > 1 ? "s" : ""} uploaded`
        );
      }

      setUploading(false);
    },
    [value, onChange, maxFiles]
  );

  const removeImage = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {value.map((url, index) => (
            <div
              key={url}
              className="group relative aspect-square rounded-xl overflow-hidden border border-border/60 bg-muted/30"
            >
              <Image
                src={url}
                alt={`Product image ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, 33vw"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}

      <label
        className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/60 bg-muted/20 p-6 transition-colors hover:border-primary/40 hover:bg-muted/40 ${
          uploading ? "pointer-events-none opacity-50" : ""
        }`}
      >
        <svg
          className="mb-2 h-8 w-8 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z"
          />
        </svg>
        <span className="text-sm text-muted-foreground">
          {uploading
            ? "Uploading..."
            : `Click to upload (max ${maxFiles} images)`}
        </span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          className="hidden"
          onChange={(e) => handleUpload(e.target.files)}
          disabled={uploading}
        />
      </label>

      {value.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {value.length}/{maxFiles} images
        </p>
      )}
    </div>
  );
}
