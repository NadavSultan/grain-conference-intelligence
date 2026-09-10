import { createHmac, timingSafeEqual } from "node:crypto";

export const USAGE_COOKIE = "grain-ai-usage";
export const USAGE_MAX = 5;

export function signUsageCookie(remaining: number): string {
  const normalized = Math.max(0, Math.min(USAGE_MAX, remaining));
  const payload = String(normalized);
  const hmac = createHmac("sha256", usageSecret()).update(payload).digest("hex");
  return `${payload}.${hmac}`;
}

export function readUsageRemaining(cookieHeader: string | null): number {
  if (!process.env.AI_USAGE_SECRET) return USAGE_MAX;
  const raw = cookieValue(cookieHeader, USAGE_COOKIE);
  if (!raw) return USAGE_MAX;
  const [payload, hmac] = raw.split(".");
  if (!payload || !hmac) return USAGE_MAX;
  const expected = createHmac("sha256", usageSecret()).update(payload).digest("hex");
  if (!safeEqual(hmac, expected)) return USAGE_MAX;
  const remaining = Number(payload);
  if (!Number.isInteger(remaining) || remaining < 0 || remaining > USAGE_MAX) return USAGE_MAX;
  return remaining;
}

export function jsonWithUsageCookie(payload: unknown, remaining: number): Response {
  const response = Response.json(payload);
  if (process.env.AI_USAGE_SECRET) {
    response.headers.set(
      "Set-Cookie",
      `${USAGE_COOKIE}=${signUsageCookie(remaining)}; HttpOnly; Path=/; SameSite=Lax`,
    );
  }
  return response;
}

function usageSecret(): string {
  const value = process.env.AI_USAGE_SECRET;
  if (!value) {
    throw new Error("usage_secret_unavailable");
  }
  return value;
}

function cookieValue(header: string | null, name: string): string | undefined {
  if (!header) return undefined;
  const match = header.split(/;\s*/).find((part) => part.startsWith(`${name}=`));
  return match?.slice(name.length + 1);
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}
