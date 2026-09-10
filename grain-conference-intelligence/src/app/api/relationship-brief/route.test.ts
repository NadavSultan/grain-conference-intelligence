import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createDemoWorkspace } from "@/data/demo-workspace";
import { PROFILES } from "@/data/prep-snapshots";
import {
  OPENAI_CREDENTIAL_COOKIE,
  encryptApiKey,
} from "@/features/integrations/openai-credentials";

const FAKE_SESSION_KEY = "test-openai-session-key-aaaa";
const FAKE_DEPLOY_KEY = "test-openai-deploy-key-bbbbbb";
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

function marcusRequest(mode: "demo" | "live" = "live") {
  const seed = createDemoWorkspace();
  const timeline = seed.timeline.filter((entry) => entry.personId === "marcus");
  return {
    mode,
    personId: "marcus",
    companyId: "payloom",
    timeline,
    evidence: PROFILES.marcus.evidence.map((item) => ({
      id: item.id,
      personId: item.personId,
      companyId: item.companyId,
    })),
    canDraftEmail: true,
    canDraftLinkedIn: true,
  };
}

function validUnclearBrief() {
  return {
    state: "unclear",
    confidence: 0.41,
    summary: "One actual meeting does not establish warming.",
    evidenceEncounterIds: ["enc-marcus-money20-prior"],
    evidenceSignalIds: ["marcus-speaker-current"],
    suggestedAngle: {
      fact: "Marcus is listed as a current-edition speaker.",
      evidenceIds: ["marcus-speaker-current"],
      relevanceInference: "Attendance is context, not buying progression.",
    },
    counterEvidence: ["Public activity is context, not a meeting or reciprocal commitment."],
    recommendedAction: "Ask whether new corridors changed FX handling?",
    followUpDraft: null,
    linkedInDraft: null,
  };
}

function expectNoSecrets(value: unknown) {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  expect(text).not.toContain(FAKE_SESSION_KEY);
  expect(text).not.toContain(FAKE_DEPLOY_KEY);
}

function sessionCookie(apiKey = FAKE_SESSION_KEY): string {
  return `${OPENAI_CREDENTIAL_COOKIE}=${encryptApiKey(apiKey, CREDENTIAL_SECRET)}`;
}

async function postBrief(init?: {
  body?: unknown;
  rawBody?: string;
  cookie?: string;
  origin?: string | null;
  contentType?: string | null;
}) {
  const { POST } = await import("./route");
  const headers: Record<string, string> = {};
  if (init?.origin !== null) {
    headers.origin = init?.origin ?? "http://localhost";
  }
  if (init?.contentType !== null) {
    headers["content-type"] = init?.contentType ?? "application/json";
  }
  if (init?.cookie) headers.cookie = init.cookie;
  return POST(
    new Request("http://localhost/api/relationship-brief", {
      method: "POST",
      headers,
      body: init?.rawBody ?? JSON.stringify(init?.body ?? marcusRequest()),
    }),
  );
}

describe("POST /api/relationship-brief", () => {
  beforeEach(() => {
    vi.resetModules();
    createMock.mockReset();
    openAiConstructor.mockReset();
    process.env.AI_USAGE_SECRET = "test-usage-secret";
    process.env.OPENAI_MODEL = "gpt-5.4-mini";
    process.env.INTEGRATION_CREDENTIAL_SECRET = CREDENTIAL_SECRET;
    delete process.env.OPENAI_API_KEY;
  });

  afterEach(() => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.INTEGRATION_CREDENTIAL_SECRET;
  });

  it("returns 400 invalid_request for null and malformed bodies", async () => {
    const nullResponse = await postBrief({ rawBody: "null" });
    expect(nullResponse.status).toBe(400);
    expect(nullResponse.status).not.toBe(500);
    const nullPayload = await nullResponse.json();
    expect(nullPayload.code).toBe("invalid_request");
    expectNoSecrets(nullPayload);

    const malformed = await postBrief({ rawBody: "{not-json" });
    expect(malformed.status).toBe(400);
    expect(await malformed.json()).toMatchObject({ ok: false, code: "invalid_request" });
  });

  it("never constructs or calls OpenAI in demo mode", async () => {
    process.env.OPENAI_API_KEY = FAKE_DEPLOY_KEY;
    const response = await postBrief({ body: marcusRequest("demo") });
    const payload = await response.json();
    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.mode).toBe("demo");
    expect(payload.provider).toBe("deterministic-demo");
    expect(payload.brief.state).toBe("unclear");
    expect(payload.usageRemaining).toBe(5);
    expect(openAiConstructor).not.toHaveBeenCalled();
    expect(createMock).not.toHaveBeenCalled();
    expectNoSecrets(payload);
  });

  it("does not decrement live usage for demo mode", async () => {
    const { signUsageCookie } = await import("./usage");
    const cookie = `grain-ai-usage=${signUsageCookie(3)}`;
    const response = await postBrief({ body: marcusRequest("demo"), cookie });
    const payload = await response.json();
    expect(payload.ok).toBe(true);
    expect(payload.mode).toBe("demo");
    expect(payload.usageRemaining).toBe(3);
    expect(createMock).not.toHaveBeenCalled();
  });

  it("decrypts a session key and passes it to the mocked OpenAI client", async () => {
    process.env.OPENAI_API_KEY = FAKE_DEPLOY_KEY;
    createMock.mockResolvedValue({ output_text: JSON.stringify(validUnclearBrief()) });
    const response = await postBrief({
      body: marcusRequest("live"),
      cookie: sessionCookie(),
    });
    const payload = await response.json();
    expect(payload.ok).toBe(true);
    expect(payload.mode).toBe("live");
    expect(payload.provider).toBe("openai");
    expect(openAiConstructor).toHaveBeenCalledTimes(1);
    expect(openAiConstructor.mock.calls[0]?.[0]).toEqual({ apiKey: FAKE_SESSION_KEY });
    expect(payload.brief.evidenceEncounterIds).toEqual(["enc-marcus-money20-prior"]);
    expectNoSecrets(payload);
    expectNoSecrets(response.headers.get("set-cookie"));
  });

  it("uses the deployment key only when no session key exists", async () => {
    process.env.OPENAI_API_KEY = FAKE_DEPLOY_KEY;
    createMock.mockResolvedValue({ output_text: JSON.stringify(validUnclearBrief()) });
    const response = await postBrief({ body: marcusRequest("live") });
    const payload = await response.json();
    expect(payload.ok).toBe(true);
    expect(openAiConstructor).toHaveBeenCalledWith({ apiKey: FAKE_DEPLOY_KEY });
    expectNoSecrets(payload);
  });

  it("does not fall back to the deployment key when session credentials are rejected", async () => {
    process.env.OPENAI_API_KEY = FAKE_DEPLOY_KEY;
    createMock.mockRejectedValue(Object.assign(new Error("Unauthorized"), { status: 401 }));
    const response = await postBrief({
      body: marcusRequest("live"),
      cookie: sessionCookie(),
    });
    const payload = await response.json();
    expect(payload.ok).toBe(false);
    expect(payload.code).toBe("invalid_credentials");
    expect(payload.fallback.state).toBe("unclear");
    expect(openAiConstructor).toHaveBeenCalledTimes(1);
    expect(openAiConstructor.mock.calls[0]?.[0]).toEqual({ apiKey: FAKE_SESSION_KEY });
    expect(createMock).toHaveBeenCalledTimes(1);
    expectNoSecrets(payload);
  });

  it("returns not_configured when Live mode has no usable key", async () => {
    const response = await postBrief({ body: marcusRequest("live") });
    const payload = await response.json();
    expect(payload.ok).toBe(false);
    expect(payload.code).toBe("not_configured");
    expect(payload.retryable).toBe(false);
    expect(payload.fallback.state).toBe("unclear");
    expect(openAiConstructor).not.toHaveBeenCalled();
    expectNoSecrets(payload);
  });

  it("fails closed for Live mode when AI_USAGE_SECRET is missing", async () => {
    delete process.env.AI_USAGE_SECRET;
    process.env.OPENAI_API_KEY = FAKE_DEPLOY_KEY;
    const response = await postBrief({ body: marcusRequest("live") });
    expect(response.status).toBe(503);
    const payload = await response.json();
    expect(payload.ok).toBe(false);
    expect(payload.fallback).toBeTruthy();
    expect(openAiConstructor).not.toHaveBeenCalled();
    expect(response.headers.get("set-cookie") ?? "").not.toMatch(/grain-ai-usage=/);
    expectNoSecrets(payload);
  });

  it("returns fallback when the model output is invalid", async () => {
    process.env.OPENAI_API_KEY = FAKE_DEPLOY_KEY;
    createMock.mockResolvedValue({
      output_text: JSON.stringify({ state: "warming", confidence: 9 }),
    });
    const response = await postBrief({ body: marcusRequest("live") });
    const payload = await response.json();
    expect(payload.ok).toBe(false);
    expect(payload.fallback.state).toBe("unclear");
    expect(payload.fallback.state).not.toBe("warming");
    expectNoSecrets(payload);
  });

  it("returns a live brief when the model output is valid and evidence-validated", async () => {
    process.env.OPENAI_API_KEY = FAKE_DEPLOY_KEY;
    createMock.mockResolvedValue({ output_text: JSON.stringify(validUnclearBrief()) });
    const response = await postBrief({ body: marcusRequest("live") });
    const payload = await response.json();
    expect(payload.ok).toBe(true);
    expect(payload.mode).toBe("live");
    expect(payload.provider).toBe("openai");
    expect(payload.model).toBe("gpt-5.4-mini");
    expect(payload.brief.evidenceEncounterIds).toEqual(["enc-marcus-money20-prior"]);
    expect(payload.usageRemaining).toBe(4);
    expect(createMock.mock.calls[0]?.[0]).toMatchObject({ store: false, model: "gpt-5.4-mini" });
    expectNoSecrets(payload);
  });

  it("uses the documented default model when OPENAI_MODEL is blank", async () => {
    process.env.OPENAI_API_KEY = FAKE_DEPLOY_KEY;
    process.env.OPENAI_MODEL = "   ";
    createMock.mockResolvedValue({ output_text: JSON.stringify(validUnclearBrief()) });
    const response = await postBrief({ body: marcusRequest("live") });
    const payload = await response.json();
    expect(payload.ok).toBe(true);
    expect(payload.model).toBe("gpt-5.4-mini");
    expect(createMock.mock.calls[0]?.[0]).toMatchObject({ store: false, model: "gpt-5.4-mini" });
  });

  it("rejects missing or foreign Origin with 403 before OpenAI or usage work", async () => {
    process.env.OPENAI_API_KEY = FAKE_DEPLOY_KEY;
    createMock.mockResolvedValue({ output_text: JSON.stringify(validUnclearBrief()) });

    const foreign = await postBrief({
      body: marcusRequest("live"),
      origin: "https://evil.example",
    });
    expect(foreign.status).toBe(403);
    expect(openAiConstructor).not.toHaveBeenCalled();
    expect(createMock).not.toHaveBeenCalled();
    expect(foreign.headers.get("set-cookie") ?? "").not.toMatch(/grain-ai-usage=/);
    expectNoSecrets(await foreign.json());

    const missingOrigin = await postBrief({
      body: marcusRequest("live"),
      origin: null,
    });
    expect(missingOrigin.status).toBe(403);
    expect(openAiConstructor).not.toHaveBeenCalled();
    expect(createMock).not.toHaveBeenCalled();
    expect(missingOrigin.headers.get("set-cookie") ?? "").not.toMatch(/grain-ai-usage=/);
  });

  it("rejects non-JSON content types before OpenAI or usage work", async () => {
    process.env.OPENAI_API_KEY = FAKE_DEPLOY_KEY;
    const response = await postBrief({
      body: marcusRequest("live"),
      contentType: "text/plain",
    });
    expect(response.status).toBe(415);
    expect(openAiConstructor).not.toHaveBeenCalled();
    expect(createMock).not.toHaveBeenCalled();
    expect(response.headers.get("set-cookie") ?? "").not.toMatch(/grain-ai-usage=/);
  });

  it("rejects the sixth live call with usage_exhausted and keeps fallback usable", async () => {
    process.env.OPENAI_API_KEY = FAKE_DEPLOY_KEY;
    createMock.mockResolvedValue({ output_text: JSON.stringify(validUnclearBrief()) });
    const { POST } = await import("./route");
    const { signUsageCookie } = await import("./usage");
    const exhausted = signUsageCookie(0);
    const response = await POST(
      new Request("http://localhost/api/relationship-brief", {
        method: "POST",
        headers: {
          origin: "http://localhost",
          "content-type": "application/json",
          cookie: `grain-ai-usage=${exhausted}`,
        },
        body: JSON.stringify(marcusRequest("live")),
      }),
    );
    const payload = await response.json();
    expect(payload.ok).toBe(false);
    expect(payload.code).toBe("usage_exhausted");
    expect(payload.fallback).toBeTruthy();
    expect(createMock).not.toHaveBeenCalled();
    expectNoSecrets(payload);
  });
});
