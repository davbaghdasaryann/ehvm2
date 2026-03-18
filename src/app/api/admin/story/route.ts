import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import type { PersonStory } from "@/admin/types";
import { readStories, writeStories } from "@/lib/adminDb";
import { isAdminRequestAuthorized } from "@/lib/adminAuth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!isAdminRequestAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const stories = await readStories();
  return NextResponse.json({ stories }, { headers: { "Cache-Control": "no-store" } });
}

export async function PUT(request: Request) {
  if (!isAdminRequestAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const payload = (await request.json()) as { stories?: unknown };
    if (!Array.isArray(payload.stories)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    const stories = payload.stories as PersonStory[];
    await writeStories(stories);
    revalidateTag("story-data");
    return NextResponse.json({ ok: true, count: stories.length });
  } catch (error) {
    console.error("Failed to save stories.", error);
    return NextResponse.json({ error: "Failed to save stories" }, { status: 500 });
  }
}
