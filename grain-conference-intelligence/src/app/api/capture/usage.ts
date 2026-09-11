import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Voice capture keeps its own allowance so a demo of the capture flow cannot
 * exhaust the Relationship Copilot's five-call budget, and vice versa.
 */
export const CAPTURE_USAGE_COOKIE = "grain-capture-usage";
export const CAPTURE_USAGE_MAX = 20;

export function signCaptureUsage(remaining: number): string {
  const normalized = Math.max(0, Math.min(CAPTURE_USAGE_MAX, remaining));
  const payload = String(normalized);
  const hmac = createHmac("sha256", usageSecret()).update(payload).digest("hex");
  return `${payload}.${hmac}`;
}

export function readCaptureUsage(cookieHeader: string | null): number {
  if (!process.env.AI_USAGE_SECRET) return CAPTURE_USAGE_MAX;
  const raw = cookieValue(cookieHeader, CAPTURE_USAGE_COOKIE);
  if (!raw) return CAPTURE_USAGE_MAX;
  const [payload, hmac] = raw.split(".");
  if (!payload || !hmac) return CAPTURE_USAGE_MAX;
  const expected = createHmac("sha256", usageSecret()).update(payload).digest("hex");
  if (!safeEqual(hmac, expected)) return CAPTURE_USAGE_MAX;
  const remaining = Number(payload);
  if (!Number.isInteger(remaining) || remaining < 0 || remaining > CAPTURE_USAGE_MAX) {
    return CAPTURE_USAGE_MAX;
  }
  return remaining;
}

export function jsonWithCaptureUsage(
  payload: unknown,
  remaining: number,
  init?: ResponseInit,
): Response {
  const response = Response.json(payload, init);
  if (process.env.AI_USAGE_SECRET) {
    response.headers.set(
      "Set-Cookie",
      `${CAPTURE_USAGE_COOKIE}=${signCaptureUsage(remaining)}; HttpOnly; Path=/; SameSite=Lax`,
    );
  }
  return response;
}

function usageSecret(): string {
  const value = process.env.AI_USAGE_SECRET;
  if (!value) throw new Error("usage_secret_unavailable");
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
