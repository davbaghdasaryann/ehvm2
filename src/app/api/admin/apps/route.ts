import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import type { AdminNewsRecord, AppRecord } from "@/admin/types";
import { readAdminDb, writeAdminDb } from "@/lib/adminDb";
import { isAdminRequestAuthorized } from "@/lib/adminAuth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!isAdminRequestAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const db = await readAdminDb();
  return NextResponse.json(db, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export async function PUT(request: Request) {
  if (!isAdminRequestAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = (await request.json()) as { apps?: unknown; news?: unknown };
    if (!Array.isArray(payload.apps)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    if (payload.news !== undefined && !Array.isArray(payload.news)) {
      return NextResponse.json({ error: "Invalid news payload" }, { status: 400 });
    }

    const apps = payload.apps as AppRecord[];
    const news = (payload.news || []) as AdminNewsRecord[];
    await writeAdminDb({ apps, news });
    revalidateTag("apps-data", "max");
    revalidateTag("news-data", "max");

    return NextResponse.json({ ok: true, count: apps.length, newsCount: news.length });
  } catch (error) {
    console.error("Failed to save admin apps payload.", error);
    return NextResponse.json({ error: "Failed to save data" }, { status: 500 });
  }
}
