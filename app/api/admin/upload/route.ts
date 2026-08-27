import crypto from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_VIDEO_BYTES = 20 * 1024 * 1024;

const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const VIDEO_TYPES: Record<string, string> = {
  "video/mp4": ".mp4",
  "video/webm": ".webm",
};

export async function POST(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await request.formData();
  const file = form.get("file");
  const kind = String(form.get("kind") || "");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file" }, { status: 400 });
  }

  const types = kind === "video" ? VIDEO_TYPES : IMAGE_TYPES;
  const extension = types[file.type];

  if (!extension) {
    return NextResponse.json(
      { error: kind === "video" ? "MP4 or WebM only" : "JPG, PNG or WebP only" },
      { status: 400 },
    );
  }

  const maxBytes = kind === "video" ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (file.size <= 0 || file.size > maxBytes) {
    return NextResponse.json(
      { error: kind === "video" ? "Video max 20MB" : "Image max 5MB" },
      { status: 400 },
    );
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads", "banners");
  await mkdir(uploadDir, { recursive: true });

  const filename = `${crypto.randomUUID()}${extension}`;
  const destination = path.join(uploadDir, filename);
  const bytes = Buffer.from(await file.arrayBuffer());

  await writeFile(destination, bytes);

  return NextResponse.json({ ok: true, url: `/uploads/banners/${filename}` });
}
