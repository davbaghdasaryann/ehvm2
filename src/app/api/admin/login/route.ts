import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  createAdminSessionToken,
  getAdminSessionMaxAgeSeconds,
  verifyAdminCredentials,
} from "@/lib/adminAuth";

export const runtime = "nodejs";

type LoginBody = {
  username?: string;
  password?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LoginBody;
    const username = (body.username || "").trim();
    const password = body.password || "";

    if (!username || !password || !verifyAdminCredentials(username, password)) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set({
      name: ADMIN_SESSION_COOKIE,
      value: createAdminSessionToken(username),
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: getAdminSessionMaxAgeSeconds(),
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
