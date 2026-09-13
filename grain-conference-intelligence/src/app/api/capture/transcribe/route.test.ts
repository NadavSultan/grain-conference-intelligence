/**
 * @vitest-environment node
 *
 * This route parses a multipart body. Under the project-wide jsdom environment
 * jsdom's File global is not the one undici's FormData accepts, so the audio
 * part is stringified and never reaches the handler.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { OPENAI_CREDENTIAL_COOKIE, encryptApiKey } from "@/features/integrations/openai-credentials";

const FAKE_KEY = "test-openai-session-key-aaaa";
const CREDENTIAL_SECRET = "test-integration-credential-secret";

const { transcriptionsCreate, openAiConstructor } = vi.hoisted(() => ({
  transcriptionsCreate: vi.fn(),
  openAiConstructor: vi.fn(),
}));

vi.mock("openai", () => ({
  default: class OpenAI {
    constructor(options: { apiKey: string }) {
      openAiConstructor(options);
    }
    audio = { transcriptions: { create: transcriptionsCreate } };
  },
}));

const ORIGIN = "http://localhost:3000";
const URL_ = `${ORIGIN}/api/capture/transcribe`;

function webmFile(bytes = 2048) {
  return new File([new Uint8Array(bytes)], "capture.webm", { type: "audio/webm" });
}

function sessionCookie() {
  return `${OPENAI_CREDENTIAL_COOKIE}=${encryptApiKey(FAKE_KEY, CREDENTIAL_SECRET)}`;
}

beforeEach(() => {
  vi.resetModules();
  transcriptionsCreate.mockReset();
  openAiConstructor.mockReset();
  process.env.AI_USAGE_SECRET = "test-usage-secret";
  process.env.INTEGRATION_CREDENTIAL_SECRET = CREDENTIAL_SECRET;
  delete process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_TRANSCRIBE_MODEL;
});

afterEach(() => {
  delete process.env.AI_USAGE_SECRET;
  delete process.env.INTEGRATION_CREDENTIAL_SECRET;
});

async function route() {
  return await import("./route");
}

describe("POST /api/capture/transcribe", () => {
  it("rejects a cross-origin request", async () => {
    const { POST } = await route();
    const form = new FormData();
    form.append("audio", webmFile());
    const response = await POST(
      new Request(URL_, { method: "POST", headers: { origin: "http://evil.example" }, body: form }),
    );
    expect(response.status).toBe(403);
    expect(transcriptionsCreate).not.toHaveBeenCalled();
  });

  it("rejects a JSON content type", async () => {
    const { POST } = await route();
    const response = await POST(
      new Request(URL_, {
        method: "POST",
        headers: { origin: ORIGIN, "content-type": "application/json" },
        body: "{}",
      }),
    );
    expect(response.status).toBe(415);
  });

  it("fails closed without AI_USAGE_SECRET", async () => {
    delete process.env.AI_USAGE_SECRET;
    const { POST } = await route();
    const response = await POST(multipart(webmFile(), sessionCookie()));
    expect(response.status).toBe(503);
    expect(transcriptionsCreate).not.toHaveBeenCalled();
  });

  it("reports not_configured with no key", async () => {
    const { POST } = await route();
    const response = await POST(multipart(webmFile()));
    const payload = await response.json();
    expect(payload).toMatchObject({ ok: false, code: "not_configured" });
    expect(transcriptionsCreate).not.toHaveBeenCalled();
  });

  it("rejects a request with no audio part", async () => {
    const { POST } = await route();
    const response = await POST(multipart(null, sessionCookie()));
    expect(response.status).toBe(400);
    expect(transcriptionsCreate).not.toHaveBeenCalled();
  });

  it("transcribes with gpt-transcribe and returns the text", async () => {
    transcriptionsCreate.mockResolvedValue({ text: "  Met Marcus at the booth.  " });
    const { POST } = await route();
    const response = await POST(multipart(webmFile(), sessionCookie()));
    const payload = await response.json();

    expect(openAiConstructor).toHaveBeenCalledWith({ apiKey: FAKE_KEY });
    expect(transcriptionsCreate.mock.calls[0][0].model).toBe("gpt-transcribe");
    expect(payload).toMatchObject({ ok: true, transcript: "Met Marcus at the booth.", model: "gpt-transcribe" });
  });

  it("reports empty_transcript when nothing audible was heard", async () => {
    transcriptionsCreate.mockResolvedValue({ text: "   " });
    const { POST } = await route();
    const response = await POST(multipart(webmFile(), sessionCookie()));
    const payload = await response.json();
    expect(payload).toMatchObject({ ok: false, code: "empty_transcript", retryable: true });
  });

  it("maps a 401 to invalid_credentials", async () => {
    transcriptionsCreate.mockRejectedValue(Object.assign(new Error("nope"), { status: 401 }));
    const { POST } = await route();
    const response = await POST(multipart(webmFile(), sessionCookie()));
    const payload = await response.json();
    expect(payload).toMatchObject({ ok: false, code: "invalid_credentials" });
  });

  it("does not spend the allowance: transcription is half of one capture", async () => {
    transcriptionsCreate.mockResolvedValue({ text: "Met Marcus." });
    const { POST } = await route();
    const response = await POST(multipart(webmFile(), sessionCookie()));
    const payload = await response.json();
    expect(payload.usageRemaining).toBe(20);
  });
});

/** Builds a real multipart request; FormData sets its own boundary header. */
function multipart(file: File | null, cookie?: string) {
  const form = new FormData();
  if (file) form.append("audio", file);
  const headers: Record<string, string> = { origin: ORIGIN };
  if (cookie) headers.cookie = cookie;
  return new Request(URL_, { method: "POST", headers, body: form });
}
