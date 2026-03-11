import { NextResponse } from "next/server";
import { isAdminRequestAuthorized } from "@/lib/adminAuth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  return NextResponse.json({
    authenticated: isAdminRequestAuthorized(request),
  });
}
