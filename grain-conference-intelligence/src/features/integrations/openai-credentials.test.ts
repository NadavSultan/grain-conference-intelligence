import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  CREDENTIAL_MAX_AGE_SECONDS,
  OPENAI_CREDENTIAL_COOKIE,
  clearCredentialCookie,
  decryptApiKey,
  encryptApiKey,
  isSameOrigin,
  resolveOpenAIApiKey,
  serializeCredentialCookie,
} from "@/features/integrations/openai-credentials";

const SECRET = "test-integration-credential-secret";
const FAKE_KEY = "test-openai-session-key-aaaa";
const FAKE_DEPLOY_KEY = "test-openai-deploy-key-bbbbbb";

describe("OpenAI credential crypto", () => {
  it("encrypts a key so the token does not contain the plaintext", () => {
    const token = encryptApiKey(FAKE_KEY, SECRET);
    expect(token).not.toContain(FAKE_KEY);
    expect(decryptApiKey(token, SECRET)).toBe(FAKE_KEY);
  });

  it("rejects tampered tokens", () => {
    const token = encryptApiKey(FAKE_KEY, SECRET);
    const tampered = `${token.slice(0, -2)}aa`;
    expect(decryptApiKey(tampered, SECRET)).toBeNull();
  });

  it("rejects expired tokens", () => {
    const token = encryptApiKey(FAKE_KEY, SECRET, Date.now() - CREDENTIAL_MAX_AGE_SECONDS * 1000 - 1);
    expect(decryptApiKey(token, SECRET)).toBeNull();
  });

  it("rejects malformed tokens", () => {
    expect(decryptApiKey("not-valid-token", SECRET)).toBeNull();
    expect(decryptApiKey("", SECRET)).toBeNull();
  });
});

describe("credential cookies", () => {
  it("serializes HttpOnly SameSite=Strict Path and Max-Age", () => {
    const header = serializeCredentialCookie("encrypted-value", {
      maxAge: CREDENTIAL_MAX_AGE_SECONDS,
      secure: false,
    });
    expect(header.startsWith(`${OPENAI_CREDENTIAL_COOKIE}=encrypted-value`)).toBe(true);
    expect(header).toContain("HttpOnly");
    expect(header).toContain("SameSite=Strict");
    expect(header).toContain("Path=/");
    expect(header).toContain(`Max-Age=${CREDENTIAL_MAX_AGE_SECONDS}`);
    expect(header).not.toContain("Secure");
  });

  it("adds Secure in production", () => {
    const header = serializeCredentialCookie("encrypted-value", {
      maxAge: CREDENTIAL_MAX_AGE_SECONDS,
      secure: true,
    });
    expect(header).toContain("Secure");
  });

  it("clears the cookie with Max-Age=0", () => {
    const header = clearCredentialCookie(false);
    expect(header).toContain(`${OPENAI_CREDENTIAL_COOKIE}=`);
    expect(header).toContain("Max-Age=0");
    expect(header).toContain("HttpOnly");
    expect(header).toContain("SameSite=Strict");
  });
});

describe("same-origin check", () => {
  it("accepts a matching Origin", () => {
    const request = new Request("http://localhost/api/integrations/openai", {
      method: "POST",
      headers: { origin: "http://localhost" },
    });
    expect(isSameOrigin(request)).toBe(true);
  });

  it("rejects a cross-origin Origin", () => {
    const request = new Request("http://localhost/api/integrations/openai", {
      method: "POST",
      headers: { origin: "https://evil.example" },
    });
    expect(isSameOrigin(request)).toBe(false);
  });

  it("rejects a missing Origin", () => {
    const request = new Request("http://localhost/api/integrations/openai", { method: "POST" });
    expect(isSameOrigin(request)).toBe(false);
  });
});

describe("resolveOpenAIApiKey", () => {
  beforeEach(() => {
    process.env.INTEGRATION_CREDENTIAL_SECRET = SECRET;
    delete process.env.OPENAI_API_KEY;
  });

  afterEach(() => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.INTEGRATION_CREDENTIAL_SECRET;
  });

  it("prefers a valid session credential over a deployment key", () => {
    process.env.OPENAI_API_KEY = FAKE_DEPLOY_KEY;
    const token = encryptApiKey(FAKE_KEY, SECRET);
    const request = new Request("http://localhost/api/relationship-brief", {
      headers: { cookie: `${OPENAI_CREDENTIAL_COOKIE}=${token}` },
    });
    const resolved = resolveOpenAIApiKey(request);
    expect(resolved.source).toBe("session");
    expect(resolved.apiKey).toBe(FAKE_KEY);
  });

  it("uses the deployment key when no session cookie exists", () => {
    process.env.OPENAI_API_KEY = FAKE_DEPLOY_KEY;
    const request = new Request("http://localhost/api/relationship-brief");
    const resolved = resolveOpenAIApiKey(request);
    expect(resolved.source).toBe("deployment");
    expect(resolved.apiKey).toBe(FAKE_DEPLOY_KEY);
  });

  it("ignores a tampered session cookie and can use the deployment key", () => {
    process.env.OPENAI_API_KEY = FAKE_DEPLOY_KEY;
    const request = new Request("http://localhost/api/relationship-brief", {
      headers: { cookie: `${OPENAI_CREDENTIAL_COOKIE}=tampered-token` },
    });
    const resolved = resolveOpenAIApiKey(request);
    expect(resolved.source).toBe("deployment");
    expect(resolved.apiKey).toBe(FAKE_DEPLOY_KEY);
  });
});
