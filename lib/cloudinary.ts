import { v2 as cloudinary } from "cloudinary";

// CLOUDINARY_URL env var is auto-detected by the SDK
// Format: cloudinary://API_KEY:API_SECRET@CLOUD_NAME

export { cloudinary };

export type CloudinaryResourceType = "image" | "video";

export interface CloudinaryAsset {
  publicId: string;
  url: string;
  resourceType: CloudinaryResourceType;
  format?: string;
  bytes?: number;
  width?: number;
  height?: number;
  duration?: number;
  createdAt?: string;
}

export async function uploadMedia(
  buffer: Buffer,
  options: {
    folder?: string;
    resourceType: CloudinaryResourceType;
    filename?: string;
  },
): Promise<CloudinaryAsset> {
  const result = await new Promise<{
    secure_url: string;
    public_id: string;
    format?: string;
    bytes?: number;
    width?: number;
    height?: number;
    duration?: number;
    created_at?: string;
  }>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: options.folder ?? "ades-collection",
          resource_type: options.resourceType,
          use_filename: true,
          unique_filename: true,
          filename_override: options.filename,
        },
        (error, result) => {
          if (error || !result) {
            reject(error ?? new Error("Upload failed"));
            return;
          }

          resolve(result);
        },
      )
      .end(buffer);
  });

  return {
    publicId: result.public_id,
    url: result.secure_url,
    resourceType: options.resourceType,
    format: result.format,
    bytes: result.bytes,
    width: result.width,
    height: result.height,
    duration: result.duration,
    createdAt: result.created_at,
  };
}

export async function listMedia(options: {
  folder?: string;
  resourceType: CloudinaryResourceType;
  maxResults?: number;
}): Promise<CloudinaryAsset[]> {
  const response = await cloudinary.api.resources({
    type: "upload",
    resource_type: options.resourceType,
    prefix: `${options.folder ?? "ades-collection"}/`,
    max_results: options.maxResults ?? 100,
  });

  return ((response.resources as Array<Record<string, unknown>>) ?? []).map(
    (resource) => ({
      publicId: String(resource.public_id),
      url: String(resource.secure_url),
      resourceType: options.resourceType,
      format:
        typeof resource.format === "string" ? resource.format : undefined,
      bytes: typeof resource.bytes === "number" ? resource.bytes : undefined,
      width: typeof resource.width === "number" ? resource.width : undefined,
      height: typeof resource.height === "number" ? resource.height : undefined,
      duration:
        typeof resource.duration === "number" ? resource.duration : undefined,
      createdAt:
        typeof resource.created_at === "string"
          ? resource.created_at
          : undefined,
    }),
  );
}

export async function deleteMedia(
  publicId: string,
  resourceType: CloudinaryResourceType,
) {
  return cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType,
    invalidate: true,
  });
}

export async function uploadImage(buffer: Buffer, folder = "ades-collection") {
  return uploadMedia(buffer, { folder, resourceType: "image" });
}

export async function deleteImage(publicId: string) {
  return deleteMedia(publicId, "image");
}
