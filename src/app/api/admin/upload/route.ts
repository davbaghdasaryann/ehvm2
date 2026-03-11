import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

function sanitizeFolder(input: string): string {
  const cleaned = input.toLowerCase().replace(/[^a-z0-9_-]/g, "");
  return cleaned || "misc";
}

function detectExtension(fileName: string, mimeType: string): string {
  const fromMime = MIME_TO_EXT[mimeType];
  if (fromMime) return fromMime;

  const parsed = path.extname(fileName || "").replace(/^\./, "").toLowerCase();
  if (parsed && /^[a-z0-9]+$/.test(parsed)) return parsed;
  return "bin";
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const folderRaw = String(formData.get("folder") || "misc");
    const folder = sanitizeFolder(folderRaw);

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
    }
    if (file.size === 0) {
      return NextResponse.json({ error: "Empty file" }, { status: 400 });
    }
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: "File is too large (max 10 MB)" }, { status: 400 });
    }

    const ext = detectExtension(file.name, file.type);
    const fileName = `${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;
    const targetDir = path.join(process.cwd(), "public", "uploads", folder);
    const targetPath = path.join(targetDir, fileName);

    await mkdir(targetDir, { recursive: true });
    const bytes = Buffer.from(await file.arrayBuffer());
    await writeFile(targetPath, bytes);

    const url = `/uploads/${folder}/${fileName}`;
    return NextResponse.json({
      ok: true,
      url,
      fileName,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    console.error("Failed to upload image.", error);
    return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
  }
}
