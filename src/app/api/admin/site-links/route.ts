import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import type { SiteLinks } from "@/admin/types";
import { readSiteLinks, writeSiteLinks } from "@/lib/adminDb";
import { isAdminRequestAuthorized } from "@/lib/adminAuth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!isAdminRequestAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const links = await readSiteLinks();
  return NextResponse.json({ siteLinks: links }, { headers: { "Cache-Control": "no-store" } });
}

export async function PUT(request: Request) {
  if (!isAdminRequestAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const payload = (await request.json()) as { siteLinks?: unknown };
    if (!payload.siteLinks || typeof payload.siteLinks !== "object") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    const links = { ...(payload.siteLinks as SiteLinks), updatedAt: new Date().toISOString() };
    await writeSiteLinks(links);
    revalidateTag("site-links-data");
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to save site links.", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
