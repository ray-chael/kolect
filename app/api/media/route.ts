import { NextRequest, NextResponse } from "next/server";
import {
    deleteMedia,
    listMedia,
    type CloudinaryResourceType,
    uploadMedia,
} from "@/lib/cloudinary";
import { requireRole } from "@/lib/session";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo"];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_VIDEO_SIZE = 100 * 1024 * 1024;

function parseResourceType(value: string | null): CloudinaryResourceType {
  return value === "video" ? "video" : "image";
}

export async function GET(request: NextRequest) {
  try {
    await requireRole("CRIMSON");

    const { searchParams } = new URL(request.url);
    const resourceType = parseResourceType(searchParams.get("resourceType"));
    const assets = await listMedia({ resourceType, folder: "ades-collection" });

    return NextResponse.json({ assets });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to load media gallery",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole("CRIMSON");

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const resourceType = parseResourceType(formData.get("resourceType") as string | null);

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const allowedTypes = resourceType === "video" ? VIDEO_TYPES : IMAGE_TYPES;
    const maxSize = resourceType === "video" ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            resourceType === "video"
              ? "Invalid video type. Allowed: MP4, WebM, MOV, AVI"
              : "Invalid image type. Allowed: JPEG, PNG, WebP, AVIF",
        },
        { status: 400 },
      );
    }

    if (file.size > maxSize) {
      return NextResponse.json(
        {
          error:
            resourceType === "video"
              ? "Video too large. Maximum 100MB"
              : "Image too large. Maximum 5MB",
        },
        { status: 400 },
      );
    }

    const bytes = await file.arrayBuffer();
    const asset = await uploadMedia(Buffer.from(bytes), {
      resourceType,
      folder: "ades-collection",
      filename: file.name.replace(/\.[^.]+$/, ""),
    });

    return NextResponse.json(asset);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Upload failed",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireRole("CRIMSON");

    const body = (await request.json()) as {
      publicId?: string;
      resourceType?: string;
    };

    if (!body.publicId) {
      return NextResponse.json({ error: "publicId is required" }, { status: 400 });
    }

    const resourceType = parseResourceType(body.resourceType ?? null);
    const result = await deleteMedia(body.publicId, resourceType);

    if (result.result !== "ok" && result.result !== "not found") {
      return NextResponse.json({ error: "Delete failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Delete failed",
      },
      { status: 500 },
    );
  }
}