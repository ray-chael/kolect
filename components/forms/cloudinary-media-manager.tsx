"use client";

import Image from "next/image";
import { useCallback, useMemo, useState } from "react";
import { Loader2, RefreshCcw, Trash2, Upload, Video, Images } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { CloudinaryAsset, CloudinaryResourceType } from "@/lib/cloudinary";

interface UploadProgressItem {
  id: string;
  name: string;
  progress: number;
}

interface CloudinaryMediaManagerProps {
  value: string[];
  onChange: (urls: string[]) => void;
  resourceType: CloudinaryResourceType;
  maxFiles?: number;
}

function createUploadId() {
  return `upload-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function CloudinaryMediaManager({
  value,
  onChange,
  resourceType,
  maxFiles = 5,
}: CloudinaryMediaManagerProps) {
  const [isLoadingGallery, setIsLoadingGallery] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [gallery, setGallery] = useState<CloudinaryAsset[]>([]);
  const [uploads, setUploads] = useState<UploadProgressItem[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const selectedUrls = useMemo(() => new Set(value), [value]);

  const refreshGallery = useCallback(async () => {
    setIsLoadingGallery(true);
    try {
      const response = await fetch(`/api/media?resourceType=${resourceType}`, {
        cache: "no-store",
      });
      const data = (await response.json()) as {
        assets?: CloudinaryAsset[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to load gallery");
      }

      setGallery(data.assets ?? []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load gallery");
    } finally {
      setIsLoadingGallery(false);
    }
  }, [resourceType]);

  const toggleGallery = useCallback(async () => {
    const nextOpen = !isGalleryOpen;
    setIsGalleryOpen(nextOpen);

    if (nextOpen) {
      await refreshGallery();
    }
  }, [isGalleryOpen, refreshGallery]);

  const removeSelected = useCallback(
    (url: string) => {
      onChange(value.filter((item) => item !== url));
    },
    [onChange, value],
  );

  const addSelected = useCallback(
    (assetUrl: string) => {
      if (selectedUrls.has(assetUrl)) {
        return;
      }

      if (value.length >= maxFiles) {
        toast.warning(`Maximum ${maxFiles} ${resourceType}s allowed`);
        return;
      }

      onChange([...value, assetUrl]);
    },
    [maxFiles, onChange, resourceType, selectedUrls, value],
  );

  const updateUploadProgress = useCallback((id: string, progress: number) => {
    setUploads((current) =>
      current.map((item) => (item.id === id ? { ...item, progress } : item)),
    );
  }, []);

  const removeUploadProgress = useCallback((id: string) => {
    setUploads((current) => current.filter((item) => item.id !== id));
  }, []);

  const uploadFile = useCallback(
    (file: File) =>
      new Promise<CloudinaryAsset>((resolve, reject) => {
        const uploadId = createUploadId();

        setUploads((current) => [
          ...current,
          { id: uploadId, name: file.name, progress: 0 },
        ]);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("resourceType", resourceType);

        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/media");

        xhr.upload.onprogress = (event) => {
          if (!event.lengthComputable) return;
          updateUploadProgress(uploadId, Math.round((event.loaded / event.total) * 100));
        };

        xhr.onload = () => {
          try {
            const data = JSON.parse(xhr.responseText || "{}");
            if (xhr.status < 200 || xhr.status >= 300) {
              reject(new Error(data.error ?? "Upload failed"));
              return;
            }

            updateUploadProgress(uploadId, 100);
            setTimeout(() => removeUploadProgress(uploadId), 400);
            resolve(data as CloudinaryAsset);
          } catch {
            reject(new Error("Upload failed"));
          }
        };

        xhr.onerror = () => reject(new Error("Upload failed"));
        xhr.onabort = () => reject(new Error("Upload cancelled"));
        xhr.send(formData);
      }),
    [removeUploadProgress, resourceType, updateUploadProgress],
  );

  const handleUpload = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;

      if (value.length + files.length > maxFiles) {
        toast.warning(`Maximum ${maxFiles} ${resourceType}s allowed`);
        return;
      }

      const uploadedAssets: CloudinaryAsset[] = [];

      for (const file of Array.from(files)) {
        try {
          const asset = await uploadFile(file);
          uploadedAssets.push(asset);
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Upload failed");
        }
      }

      if (uploadedAssets.length > 0) {
        onChange([...value, ...uploadedAssets.map((asset) => asset.url)]);
        toast.success(
          `${uploadedAssets.length} ${resourceType}${uploadedAssets.length > 1 ? "s" : ""} uploaded`,
        );

        if (isGalleryOpen) {
          await refreshGallery();
        }
      }
    },
    [isGalleryOpen, maxFiles, onChange, refreshGallery, resourceType, uploadFile, value],
  );

  const handleDeleteAsset = useCallback(
    async (asset: CloudinaryAsset) => {
      if (!window.confirm(`Delete this ${resourceType} from Cloudinary?`)) {
        return;
      }

      setDeletingId(asset.publicId);
      try {
        const response = await fetch("/api/media", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            publicId: asset.publicId,
            resourceType,
          }),
        });

        const data = (await response.json()) as { error?: string };
        if (!response.ok) {
          throw new Error(data.error ?? "Delete failed");
        }

        setGallery((current) =>
          current.filter((item) => item.publicId !== asset.publicId),
        );
        onChange(value.filter((url) => url !== asset.url));
        toast.success(`${resourceType === "image" ? "Image" : "Video"} deleted`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Delete failed");
      } finally {
        setDeletingId(null);
      }
    },
    [onChange, resourceType, value],
  );

  return (
    <div className="space-y-4">
      {value.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {value.map((url) => (
            <div
              key={url}
              className="group relative overflow-hidden rounded-xl border border-border/60 bg-muted/30"
            >
              {resourceType === "image" ? (
                <div className="relative aspect-square">
                  <Image
                    src={url}
                    alt="Selected media"
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, 33vw"
                  />
                </div>
              ) : (
                <video
                  src={url}
                  controls
                  preload="metadata"
                  className="aspect-video w-full bg-black"
                />
              )}
              <button
                type="button"
                onClick={() => removeSelected(url)}
                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                title="Remove from product"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {uploads.length > 0 && (
        <div className="space-y-2 rounded-2xl border border-border/60 bg-muted/20 p-4">
          {uploads.map((upload) => (
            <div key={upload.id} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="truncate text-muted-foreground">{upload.name}</span>
                <span className="font-medium">{upload.progress}%</span>
              </div>
              <Progress value={upload.progress} className="gap-0" />
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <label className="flex cursor-pointer items-center gap-2 rounded-full border border-border/60 bg-muted/20 px-5 py-3 text-sm font-medium transition-colors hover:border-primary/40 hover:bg-muted/40">
          <Upload className="h-4 w-4" />
          Upload {resourceType === "image" ? "media" : "video"}
          <input
            type="file"
            accept={resourceType === "image" ? "image/jpeg,image/png,image/webp,image/avif" : "video/mp4,video/webm,video/quicktime,video/x-msvideo"}
            multiple
            className="hidden"
            onChange={(event) => handleUpload(event.target.files)}
          />
        </label>

        <Button
          type="button"
          variant="outline"
          className="rounded-full"
          onClick={toggleGallery}
        >
          {resourceType === "image" ? <Images className="mr-2 h-4 w-4" /> : <Video className="mr-2 h-4 w-4" />}
          {isGalleryOpen ? "Hide gallery" : "Browse Cloudinary gallery"}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        {value.length}/{maxFiles} selected. You can upload new files or reuse media already in Cloudinary.
      </p>

      {isGalleryOpen && (
        <div className="space-y-4 rounded-2xl border border-border/60 bg-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold tracking-tight">Cloudinary Gallery</h3>
              <p className="text-xs text-muted-foreground">
                Reuse or delete previously uploaded {resourceType}s.
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={refreshGallery}
              disabled={isLoadingGallery}
              title="Refresh gallery"
            >
              <RefreshCcw className={`h-4 w-4 ${isLoadingGallery ? "animate-spin" : ""}`} />
            </Button>
          </div>

          {isLoadingGallery ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading gallery...
            </div>
          ) : gallery.length === 0 ? (
            <p className="text-sm text-muted-foreground">No uploaded {resourceType}s found.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {gallery.map((asset) => {
                const isSelected = selectedUrls.has(asset.url);

                return (
                  <div
                    key={asset.publicId}
                    className="overflow-hidden rounded-xl border border-border/60 bg-muted/20"
                  >
                    {resourceType === "image" ? (
                      <div className="relative aspect-square">
                        <Image
                          src={asset.url}
                          alt={asset.publicId}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 50vw, 33vw"
                        />
                      </div>
                    ) : (
                      <video
                        src={asset.url}
                        controls
                        preload="metadata"
                        className="aspect-video w-full bg-black"
                      />
                    )}
                    <div className="space-y-2 p-3">
                      <p className="truncate text-xs text-muted-foreground">{asset.publicId}</p>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          className="flex-1 rounded-full"
                          variant={isSelected ? "outline" : "default"}
                          onClick={() => addSelected(asset.url)}
                          disabled={isSelected}
                        >
                          {isSelected ? "Selected" : "Use"}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="rounded-full"
                          onClick={() => handleDeleteAsset(asset)}
                          disabled={deletingId === asset.publicId}
                          title="Delete from Cloudinary"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}