import { NextResponse } from "next/server";
import { getAppBySlug } from "@/lib/data";
import { getAppfiguresSnapshot, hasAppfiguresAccess } from "@/lib/appfigures";
import type { AppfiguresRouteResponse } from "@/lib/appfigures-types";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const app = await getAppBySlug(slug);

  if (!app) {
    return NextResponse.json({ configured: false, reason: "App not found." } satisfies AppfiguresRouteResponse, {
      status: 404,
    });
  }

  if (!app.appfigures?.products.length) {
    return NextResponse.json({
      configured: false,
      reason: "No Appfigures product identifiers are configured for this app yet.",
    } satisfies AppfiguresRouteResponse);
  }

  if (!hasAppfiguresAccess()) {
    return NextResponse.json({
      configured: false,
      reason: "APPFIGURES_TOKEN is not configured on the server.",
    } satisfies AppfiguresRouteResponse);
  }

  try {
    const snapshot = await getAppfiguresSnapshot(app.appfigures);
    if (!snapshot) {
      return NextResponse.json({
        configured: false,
        reason: "Appfigures data is unavailable for this app.",
      } satisfies AppfiguresRouteResponse);
    }

    return NextResponse.json(
      { configured: true, snapshot } satisfies AppfiguresRouteResponse,
      {
        headers: {
          "Cache-Control": "s-maxage=21600, stale-while-revalidate=86400",
        },
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        configured: false,
        reason: error instanceof Error ? error.message : "Unknown Appfigures error.",
      } satisfies AppfiguresRouteResponse,
      { status: 500 },
    );
  }
}
