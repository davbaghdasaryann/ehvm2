import { NextResponse } from "next/server";
import { getAppBySlug, getAppParsedContentByPageId } from "@/lib/data";
export const revalidate = 3600;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const url = new URL(request.url);
  const pageId = url.searchParams.get("pageId") || undefined;
  const { slug } = await params;
  if (pageId) {
    const parsed = await getAppParsedContentByPageId(pageId);
    return NextResponse.json(
      {
        blocks: parsed.notionPageBlocks || [],
      },
      {
        headers: {
          "Cache-Control": "public, max-age=300, stale-while-revalidate=86400",
        },
      },
    );
  }

  const app = await getAppBySlug(slug);
  if (!app || !app.notionPageId) return NextResponse.json({ blocks: [] });

  const parsed = await getAppParsedContentByPageId(app.notionPageId);

  return NextResponse.json(
    {
      blocks: parsed.notionPageBlocks || [],
    },
    {
      headers: {
        "Cache-Control": "public, max-age=300, stale-while-revalidate=86400",
      },
    },
  );
}
