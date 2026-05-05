import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getUploadPath } from "@/lib/uploadPaths";

export const runtime = "nodejs";

const CONTENT_TYPES: Record<string, string> = {
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: parts } = await params;
  const targetPath = getUploadPath(parts);
  if (!targetPath) {
    return NextResponse.json({ error: "Invalid upload path" }, { status: 400 });
  }

  try {
    const file = await readFile(targetPath);
    const contentType = CONTENT_TYPES[path.extname(targetPath).toLowerCase()] || "application/octet-stream";

    return new NextResponse(file, {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Type": contentType,
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
