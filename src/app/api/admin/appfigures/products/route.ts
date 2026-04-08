import { NextResponse } from "next/server";
import { isAdminRequestAuthorized } from "@/lib/adminAuth";
import { hasAppfiguresAccess, listAppfiguresProducts } from "@/lib/appfigures";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!isAdminRequestAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasAppfiguresAccess()) {
    return NextResponse.json(
      { configured: false, error: "APPFIGURES_TOKEN is not configured on the server.", products: [] },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const products = await listAppfiguresProducts();
    return NextResponse.json(
      { configured: true, products },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Failed to load Appfigures products.", error);
    return NextResponse.json(
      {
        configured: true,
        error: error instanceof Error ? error.message : "Failed to load Appfigures products.",
        products: [],
      },
      { status: 500 },
    );
  }
}
