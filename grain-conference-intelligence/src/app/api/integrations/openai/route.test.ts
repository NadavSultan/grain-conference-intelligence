import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  CREDENTIAL_MAX_AGE_SECONDS,
  OPENAI_CREDENTIAL_COOKIE,
  decryptApiKey,
  encryptApiKey,
} from "@/features/integrations/openai-credentials";

const SECRET = "test-integration-credential-secret";
const FAKE_KEY = "test-openai-session-key-aaaa";

function cookieHeader(response: Response): string {
  return response.headers.get("set-cookie") ?? "";
}

function cookieValue(header: string): string {
  const first = header.split(";")[0] ?? "";
  return first.slice(first.indexOf("=") + 1);
}

async function loadRoute() {
  return import("./route");
}

describe("GET/POST/DELETE /api/integrations/openai", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.INTEGRATION_CREDENTIAL_SECRET = SECRET;
    process.env.OPENAI_MODEL = "gpt-5.4-mini";
    delete process.env.OPENAI_API_KEY;
  });

  afterEach(() => {
    delete process.env.INTEGRATION_CREDENTIAL_SECRET;
    delete process.env.OPENAI_API_KEY;
    delete process.env.AI_USAGE_SECRET;
    vi.unstubAllEnvs();
  });

  it("rejects null, malformed, too-short and too-long keys", async () => {
    const { POST } = await loadRoute();
    const origin = "http://localhost";

    const nullResponse = await POST(
      new Request("http://localhost/api/integrations/openai", {
        method: "POST",
        headers: { origin, "content-type": "application/json" },
        body: "null",
      }),
    );
    expect(nullResponse.status).toBe(400);

    const malformed = await POST(
      new Request("http://localhost/api/integrations/openai", {
        method: "POST",
        headers: { origin, "content-type": "application/json" },
        body: "{not-json",
      }),
    );
    expect(malformed.status).toBe(400);

    const tooShort = await POST(
      new Request("http://localhost/api/integrations/openai", {
        method: "POST",
        headers: { origin, "content-type": "application/json" },
        body: JSON.stringify({ apiKey: "short-key" }),
      }),
    );
    expect(tooShort.status).toBe(400);

    const tooLong = await POST(
      new Request("http://localhost/api/integrations/openai", {
        method: "POST",
        headers: { origin, "content-type": "application/json" },
        body: JSON.stringify({ apiKey: "x".repeat(513) }),
      }),
    );
    expect(tooLong.status).toBe(400);
  });

  it("fails closed with 503 when the encryption secret is missing", async () => {
    delete process.env.INTEGRATION_CREDENTIAL_SECRET;
    const { POST } = await loadRoute();
    const response = await POST(
      new Request("http://localhost/api/integrations/openai", {
        method: "POST",
        headers: { origin: "http://localhost", "content-type": "application/json" },
        body: JSON.stringify({ apiKey: FAKE_KEY }),
      }),
    );
    expect(response.status).toBe(503);
    const payload = await response.json();
    expect(payload).toEqual({
      configured: false,
      liveConfigured: false,
      source: "none",
      model: "gpt-5.4-mini",
    });
    expect(JSON.stringify(payload)).not.toContain(FAKE_KEY);
    expect(cookieHeader(response)).toBe("");
  });

  it("stores an encrypted HttpOnly session cookie and never returns the key", async () => {
    const { POST, GET } = await loadRoute();
    const response = await POST(
      new Request("http://localhost/api/integrations/openai", {
        method: "POST",
        headers: { origin: "http://localhost", "content-type": "application/json" },
        body: JSON.stringify({ apiKey: FAKE_KEY }),
      }),
    );
    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload).toEqual({
      configured: true,
      liveConfigured: false,
      source: "session",
      model: "gpt-5.4-mini",
    });
    expect(JSON.stringify(payload)).not.toContain(FAKE_KEY);

    const setCookie = cookieHeader(response);
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("SameSite=Strict");
    expect(setCookie).toContain("Path=/");
    expect(setCookie).toContain(`Max-Age=${CREDENTIAL_MAX_AGE_SECONDS}`);
    expect(setCookie).not.toMatch(/(?:^|;)\s*Secure(?:;|$)/i);
    expect(setCookie).not.toContain(FAKE_KEY);

    const token = cookieValue(setCookie);
    expect(token).not.toBe(FAKE_KEY);
    expect(decryptApiKey(token, SECRET)).toBe(FAKE_KEY);

    const status = await GET(
      new Request("http://localhost/api/integrations/openai", {
        headers: { cookie: `${OPENAI_CREDENTIAL_COOKIE}=${token}` },
      }),
    );
    expect(status.headers.get("cache-control")).toBe("no-store");
    const statusPayload = await status.json();
    expect(Object.keys(statusPayload).sort()).toEqual(["configured", "liveConfigured", "model", "source"]);
    expect(statusPayload).toEqual({
      configured: true,
      liveConfigured: false,
      source: "session",
      model: "gpt-5.4-mini",
    });
    expect(JSON.stringify(statusPayload)).not.toContain(FAKE_KEY);
  });

  it("sets Secure on the credential cookie in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.resetModules();
    process.env.INTEGRATION_CREDENTIAL_SECRET = SECRET;
    const { POST } = await loadRoute();
    const response = await POST(
      new Request("http://localhost/api/integrations/openai", {
        method: "POST",
        headers: { origin: "http://localhost", "content-type": "application/json" },
        body: JSON.stringify({ apiKey: FAKE_KEY }),
      }),
    );
    const setCookie = cookieHeader(response);
    expect(setCookie).toMatch(/;\s*Secure(?:;|$)/);
    expect(setCookie).not.toContain(FAKE_KEY);
  });

  it("clears the cookie on DELETE", async () => {
    const { DELETE } = await loadRoute();
    const response = await DELETE(
      new Request("http://localhost/api/integrations/openai", {
        method: "DELETE",
        headers: { origin: "http://localhost" },
      }),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      configured: false,
      liveConfigured: false,
      source: "none",
      model: "gpt-5.4-mini",
    });
    const setCookie = cookieHeader(response);
    expect(setCookie).toContain(`${OPENAI_CREDENTIAL_COOKIE}=`);
    expect(setCookie).toContain("Max-Age=0");
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("SameSite=Strict");
  });

  it("rejects tampered session cookies on GET", async () => {
    const { GET } = await loadRoute();
    const response = await GET(
      new Request("http://localhost/api/integrations/openai", {
        headers: { cookie: `${OPENAI_CREDENTIAL_COOKIE}=tampered-value` },
      }),
    );
    const payload = await response.json();
    expect(payload).toEqual({
      configured: false,
      liveConfigured: false,
      source: "none",
      model: "gpt-5.4-mini",
    });
  });

  it("rejects expired session cookies on GET", async () => {
    const expired = encryptApiKey(FAKE_KEY, SECRET, Date.now() - CREDENTIAL_MAX_AGE_SECONDS * 1000 - 5);
    const { GET } = await loadRoute();
    const response = await GET(
      new Request("http://localhost/api/integrations/openai", {
        headers: { cookie: `${OPENAI_CREDENTIAL_COOKIE}=${expired}` },
      }),
    );
    const payload = await response.json();
    expect(payload).toEqual({
      configured: false,
      liveConfigured: false,
      source: "none",
      model: "gpt-5.4-mini",
    });
    expect(JSON.stringify(payload)).not.toContain(FAKE_KEY);
  });

  it("reports configured without liveConfigured when a key exists but AI_USAGE_SECRET is missing", async () => {
    process.env.OPENAI_API_KEY = FAKE_KEY;
    delete process.env.AI_USAGE_SECRET;
    const { GET } = await loadRoute();
    const response = await GET(new Request("http://localhost/api/integrations/openai"));
    const payload = await response.json();
    expect(payload).toEqual({
      configured: true,
      liveConfigured: false,
      source: "deployment",
      model: "gpt-5.4-mini",
    });
    expect(JSON.stringify(payload)).not.toContain(FAKE_KEY);
  });

  it("reports liveConfigured only when a credential and AI_USAGE_SECRET are both present", async () => {
    process.env.OPENAI_API_KEY = FAKE_KEY;
    process.env.AI_USAGE_SECRET = "test-usage-secret";
    const { GET } = await loadRoute();
    const response = await GET(new Request("http://localhost/api/integrations/openai"));
    const payload = await response.json();
    expect(payload).toEqual({
      configured: true,
      liveConfigured: true,
      source: "deployment",
      model: "gpt-5.4-mini",
    });
    expect(JSON.stringify(payload)).not.toContain(FAKE_KEY);
  });

  it("enforces same-origin on POST and DELETE", async () => {
    const { POST, DELETE } = await loadRoute();
    const crossPost = await POST(
      new Request("http://localhost/api/integrations/openai", {
        method: "POST",
        headers: { origin: "https://evil.example", "content-type": "application/json" },
        body: JSON.stringify({ apiKey: FAKE_KEY }),
      }),
    );
    expect(crossPost.status).toBe(403);
    expect(cookieHeader(crossPost)).toBe("");

    const missingOrigin = await POST(
      new Request("http://localhost/api/integrations/openai", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ apiKey: FAKE_KEY }),
      }),
    );
    expect(missingOrigin.status).toBe(403);

    const crossDelete = await DELETE(
      new Request("http://localhost/api/integrations/openai", {
        method: "DELETE",
        headers: { origin: "https://evil.example" },
      }),
    );
    expect(crossDelete.status).toBe(403);
  });
});
