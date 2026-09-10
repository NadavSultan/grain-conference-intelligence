import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

export const OPENAI_CREDENTIAL_COOKIE = "grain-openai-credential";
export const CREDENTIAL_MAX_AGE_SECONDS = 60 * 60;
export const OPENAI_MODEL_DEFAULT = "gpt-5.4-mini";

export type CredentialSource = "session" | "deployment" | "none";

export type OpenAICredentialStatus = {
  configured: boolean;
  source: CredentialSource;
  model: string;
};

type EncryptedCredential = {
  v: 1;
  k: string;
  exp: number;
};

export function openaiModel(): string {
  return process.env.OPENAI_MODEL?.trim() || OPENAI_MODEL_DEFAULT;
}

export function integrationCredentialSecret(): string | null {
  const secret = process.env.INTEGRATION_CREDENTIAL_SECRET;
  if (!secret) return null;
  return secret;
}

export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export function encryptApiKey(apiKey: string, secret: string, now = Date.now()): string {
  const payload: EncryptedCredential = {
    v: 1,
    k: apiKey,
    exp: now + CREDENTIAL_MAX_AGE_SECONDS * 1000,
  };
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", deriveKey(secret), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(payload), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64url");
}

export function decryptApiKey(token: string, secret: string, now = Date.now()): string | null {
  try {
    const buffer = Buffer.from(token, "base64url");
    if (buffer.length < 29) return null;
    const iv = buffer.subarray(0, 12);
    const tag = buffer.subarray(12, 28);
    const data = buffer.subarray(28);
    const decipher = createDecipheriv("aes-256-gcm", deriveKey(secret), iv);
    decipher.setAuthTag(tag);
    const json = Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
    const parsed = JSON.parse(json) as EncryptedCredential;
    if (parsed.v !== 1 || typeof parsed.k !== "string" || typeof parsed.exp !== "number") {
      return null;
    }
    if (parsed.exp <= now) return null;
    if (parsed.k.length < 20 || parsed.k.length > 512) return null;
    return parsed.k;
  } catch {
    return null;
  }
}

export function serializeCredentialCookie(
  value: string,
  options: { maxAge: number; secure: boolean },
): string {
  const parts = [
    `${OPENAI_CREDENTIAL_COOKIE}=${value}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Strict",
    `Max-Age=${options.maxAge}`,
  ];
  if (options.secure) parts.push("Secure");
  return parts.join("; ");
}

export function clearCredentialCookie(secure: boolean): string {
  return serializeCredentialCookie("", { maxAge: 0, secure });
}

export function credentialCookieSecure(): boolean {
  return process.env.NODE_ENV === "production";
}

export function readCookie(header: string | null, name: string): string | undefined {
  if (!header) return undefined;
  const match = header.split(/;\s*/).find((part) => part.startsWith(`${name}=`));
  return match?.slice(name.length + 1);
}

export function resolveOpenAIApiKey(request: Request): {
  apiKey: string | null;
  source: CredentialSource;
} {
  const secret = integrationCredentialSecret();
  const token = readCookie(request.headers.get("cookie"), OPENAI_CREDENTIAL_COOKIE);
  if (token && secret) {
    const apiKey = decryptApiKey(token, secret);
    if (apiKey) return { apiKey, source: "session" };
  }

  const deployment = process.env.OPENAI_API_KEY?.trim();
  if (deployment) return { apiKey: deployment, source: "deployment" };
  return { apiKey: null, source: "none" };
}

export function credentialStatus(request: Request): OpenAICredentialStatus {
  const resolved = resolveOpenAIApiKey(request);
  return {
    configured: resolved.source !== "none",
    source: resolved.source,
    model: openaiModel(),
  };
}

function deriveKey(secret: string): Buffer {
  return createHash("sha256").update(secret).digest();
}
