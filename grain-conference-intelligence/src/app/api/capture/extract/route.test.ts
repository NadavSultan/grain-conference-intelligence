import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { OPENAI_CREDENTIAL_COOKIE, encryptApiKey } from "@/features/integrations/openai-credentials";
import { EMPTY_EXTRACTION } from "@/features/capture/voice-extraction";

const FAKE_KEY = "test-openai-session-key-aaaa";
const CREDENTIAL_SECRET = "test-integration-credential-secret";

const { createMock, openAiConstructor } = vi.hoisted(() => ({
  createMock: vi.fn(),
  openAiConstructor: vi.fn(),
}));

vi.mock("openai", () => ({
  default: class OpenAI {
    constructor(options: { apiKey: string }) {
      openAiConstructor(options);
    }
    responses = { create: createMock };
  },
}));

const ORIGIN = "http://localhost:3000";
const URL_ = `${ORIGIN}/api/capture/extract`;

function post(body: unknown, headers: Record<string, string> = {}) {
  return new Request(URL_, {
    method: "POST",
    headers: { origin: ORIGIN, "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

function sessionCookie() {
  return `${OPENAI_CREDENTIAL_COOKIE}=${encryptApiKey(FAKE_KEY, CREDENTIAL_SECRET)}`;
}

function modelOutput(extraction: Record<string, string>) {
  return { output_text: JSON.stringify(extraction) };
}

beforeEach(() => {
  vi.resetModules();
  createMock.mockReset();
  openAiConstructor.mockReset();
  process.env.AI_USAGE_SECRET = "test-usage-secret";
  process.env.INTEGRATION_CREDENTIAL_SECRET = CREDENTIAL_SECRET;
  delete process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_CAPTURE_MODEL;
});

afterEach(() => {
  delete process.env.AI_USAGE_SECRET;
  delete process.env.INTEGRATION_CREDENTIAL_SECRET;
});

async function route() {
  return await import("./route");
}

describe("POST /api/capture/extract", () => {
  it("rejects a cross-origin request", async () => {
    const { POST } = await route();
    const response = await POST(
      new Request(URL_, {
        method: "POST",
        headers: { origin: "http://evil.example", "content-type": "application/json" },
        body: "{}",
      }),
    );
    expect(response.status).toBe(403);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("rejects a non-JSON content type", async () => {
    const { POST } = await route();
    const response = await POST(
      new Request(URL_, {
        method: "POST",
        headers: { origin: ORIGIN, "content-type": "text/plain" },
        body: "hello",
      }),
    );
    expect(response.status).toBe(415);
  });

  it("rejects an empty transcript", async () => {
    const { POST } = await route();
    const response = await POST(post({ transcript: "" }, { cookie: sessionCookie() }));
    expect(response.status).toBe(400);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("fails closed without AI_USAGE_SECRET", async () => {
    delete process.env.AI_USAGE_SECRET;
    const { POST } = await route();
    const response = await POST(post({ transcript: "hi" }, { cookie: sessionCookie() }));
    expect(response.status).toBe(503);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("reports not_configured with no key", async () => {
    const { POST } = await route();
    const response = await POST(post({ transcript: "hi" }));
    const payload = await response.json();
    expect(payload).toMatchObject({ ok: false, code: "not_configured" });
    expect(createMock).not.toHaveBeenCalled();
  });

  it("calls gpt-5.6-luna at low reasoning effort with a strict schema", async () => {
    createMock.mockResolvedValue(
      modelOutput({ ...EMPTY_EXTRACTION, name: "Marcus Oyelaran", note: "FX exposure" }),
    );
    const { POST } = await route();
    const response = await POST(
      post({ transcript: "Met Marcus Oyelaran, we talked FX exposure" }, { cookie: sessionCookie() }),
    );
    const payload = await response.json();

    expect(openAiConstructor).toHaveBeenCalledWith({ apiKey: FAKE_KEY });
    const call = createMock.mock.calls[0][0];
    expect(call.model).toBe("gpt-5.6-luna");
    expect(call.reasoning).toEqual({ effort: "low" });
    expect(call.store).toBe(false);
    expect(call.text.format.strict).toBe(true);
    expect(call.text.format.type).toBe("json_schema");

    expect(payload.ok).toBe(true);
    expect(payload.model).toBe("gpt-5.6-luna");
    expect(payload.extraction.name).toBe("Marcus Oyelaran");
    expect(payload.filled).toEqual(["name", "note"]);
  });

  it("normalizes a dictated email before returning it", async () => {
    createMock.mockResolvedValue(
      modelOutput({ ...EMPTY_EXTRACTION, email: "marcus at northwind dot com" }),
    );
    const { POST } = await route();
    const response = await POST(post({ transcript: "his email is..." }, { cookie: sessionCookie() }));
    const payload = await response.json();
    expect(payload.extraction.email).toBe("marcus@northwind.com");
  });

  it("returns invalid_schema when the model breaks the contract", async () => {
    createMock.mockResolvedValue({ output_text: JSON.stringify({ name: "Marcus" }) });
    const { POST } = await route();
    const response = await POST(post({ transcript: "x" }, { cookie: sessionCookie() }));
    const payload = await response.json();
    expect(payload).toMatchObject({ ok: false, code: "invalid_schema", retryable: true });
  });

  it("maps a 401 to invalid_credentials", async () => {
    createMock.mockRejectedValue(Object.assign(new Error("nope"), { status: 401 }));
    const { POST } = await route();
    const response = await POST(post({ transcript: "x" }, { cookie: sessionCookie() }));
    const payload = await response.json();
    expect(payload).toMatchObject({ ok: false, code: "invalid_credentials" });
  });

  it("decrements the capture allowance and sets a signed cookie", async () => {
    createMock.mockResolvedValue(modelOutput({ ...EMPTY_EXTRACTION, name: "Marcus" }));
    const { POST } = await route();
    const response = await POST(post({ transcript: "x" }, { cookie: sessionCookie() }));
    const payload = await response.json();
    expect(payload.usageRemaining).toBe(19);
    expect(response.headers.get("set-cookie")).toContain("grain-capture-usage=19.");
  });

  it("does not spend the Copilot's own allowance cookie", async () => {
    createMock.mockResolvedValue(modelOutput({ ...EMPTY_EXTRACTION, name: "Marcus" }));
    const { POST } = await route();
    const response = await POST(post({ transcript: "x" }, { cookie: sessionCookie() }));
    expect(response.headers.get("set-cookie")).not.toContain("grain-ai-usage");
  });
});
