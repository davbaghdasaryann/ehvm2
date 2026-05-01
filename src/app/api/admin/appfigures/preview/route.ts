import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getAppfiguresSnapshot } from "@/lib/appfigures";
import { deriveAppfiguresData } from "@/lib/appfiguresDerived";
import type { AppfiguresConfig } from "@/lib/appfigures-types";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const config = body.config as AppfiguresConfig | undefined;

    if (!config || !config.products || config.products.length === 0) {
      return NextResponse.json({
        error: "No Appfigures products configured"
      }, { status: 400 });
    }

    const snapshot = await getAppfiguresSnapshot(config);
    const derived = deriveAppfiguresData(snapshot);

    return NextResponse.json({
      ok: true,
      data: {
        kpis: derived.kpis,
        charts: derived.charts,
        financialCards: derived.financialCards,
        highlights: derived.highlights,
        storeSignals: derived.storeSignals,
        reviews: derived.reviews,
      },
    });
  } catch (error) {
    console.error("Appfigures preview error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch Appfigures data" },
      { status: 500 }
    );
  }
}
