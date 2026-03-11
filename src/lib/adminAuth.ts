import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_SESSION_COOKIE = "ehvm_admin_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function getAuthSecret(): string {
  return process.env.ADMIN_AUTH_SECRET || "change-this-admin-secret";
}

function getExpectedUsername(): string {
  return process.env.ADMIN_USERNAME || "admin";
}

function getExpectedPassword(): string {
  return process.env.ADMIN_PASSWORD || "admin123";
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

function signPayload(payload: string): string {
  return createHmac("sha256", getAuthSecret()).update(payload).digest("base64url");
}

function parseCookies(header: string): Record<string, string> {
  return header
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((acc, pair) => {
      const index = pair.indexOf("=");
      if (index === -1) return acc;
      const key = pair.slice(0, index).trim();
      const value = pair.slice(index + 1).trim();
      if (key) acc[key] = value;
      return acc;
    }, {});
}

export function verifyAdminCredentials(username: string, password: string): boolean {
  return safeEqual(username, getExpectedUsername()) && safeEqual(password, getExpectedPassword());
}

export function createAdminSessionToken(username: string): string {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS;
  const payload = `${username}.${expiresAt}`;
  const signature = signPayload(payload);
  return `${payload}.${signature}`;
}

export function verifyAdminSessionToken(token?: string | null): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;

  const [username, expiresAtRaw, providedSignature] = parts;
  if (!username || !expiresAtRaw || !providedSignature) return false;

  const expiresAt = Number.parseInt(expiresAtRaw, 10);
  if (!Number.isFinite(expiresAt)) return false;
  if (expiresAt <= Math.floor(Date.now() / 1000)) return false;

  const payload = `${username}.${expiresAtRaw}`;
  const expectedSignature = signPayload(payload);
  return safeEqual(providedSignature, expectedSignature);
}

export async function isAdminAuthenticatedFromCookies(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  return verifyAdminSessionToken(token);
}

export function isAdminRequestAuthorized(request: Request): boolean {
  const header = request.headers.get("cookie") || "";
  const parsed = parseCookies(header);
  return verifyAdminSessionToken(parsed[ADMIN_SESSION_COOKIE]);
}

export function getAdminSessionMaxAgeSeconds(): number {
  return SESSION_MAX_AGE_SECONDS;
}
