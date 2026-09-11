import OpenAI from "openai";

import { captureTranscribeModel } from "@/features/capture/voice-extraction";
import { aiUsageSecret, isSameOrigin, resolveOpenAIApiKey } from "@/features/integrations/openai-credentials";

import { CAPTURE_USAGE_MAX, jsonWithCaptureUsage, readCaptureUsage } from "../usage";

/** OpenAI rejects audio above 25 MB; a floor note is seconds long, so this is a sanity bound. */
const MAX_AUDIO_BYTES = 25 * 1024 * 1024;

export async function POST(request: Request): Promise<Response> {
  if (!isSameOrigin(request)) {
    return Response.json({ ok: false, code: "forbidden", retryable: false }, { status: 403 });
  }

  const contentType = request.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase();
  if (contentType !== "multipart/form-data") {
    return Response.json({ ok: false, code: "invalid_request", retryable: false }, { status: 415 });
  }

  if (!aiUsageSecret()) {
    return Response.json({ ok: false, code: "provider_error", retryable: true }, { status: 503 });
  }

  const remaining = readCaptureUsage(request.headers.get("cookie"));

  const resolved = resolveOpenAIApiKey(request);
  if (!resolved.apiKey) {
    return jsonWithCaptureUsage({ ok: false, code: "not_configured", retryable: false, usageRemaining: remaining }, remaining);
  }

  if (remaining <= 0) {
    return jsonWithCaptureUsage({ ok: false, code: "usage_exhausted", retryable: false, usageRemaining: 0 }, 0);
  }

  let audio: unknown;
  try {
    audio = (await request.formData()).get("audio");
  } catch {
    return Response.json({ ok: false, code: "invalid_request", retryable: false }, { status: 400 });
  }

  if (!isUploadedAudio(audio) || audio.size === 0) {
    return Response.json({ ok: false, code: "invalid_request", retryable: false }, { status: 400 });
  }

  if (audio.size > MAX_AUDIO_BYTES) {
    return Response.json({ ok: false, code: "audio_too_large", retryable: false }, { status: 413 });
  }

  const model = captureTranscribeModel();
  try {
    const client = new OpenAI({ apiKey: resolved.apiKey });
    const result = await client.audio.transcriptions.create(
      { file: audio, model },
      { timeout: 30_000 },
    );

    const transcript = typeof result?.text === "string" ? result.text.trim() : "";
    if (!transcript) {
      return jsonWithCaptureUsage(
        { ok: false, code: "empty_transcript", retryable: true, usageRemaining: remaining },
        remaining,
      );
    }

    return jsonWithCaptureUsage(
      { ok: true, transcript, model, usageRemaining: remaining },
      remaining,
    );
  } catch (error) {
    const code = isOpenAIAuthError(error) ? "invalid_credentials" : "provider_error";
    return jsonWithCaptureUsage(
      { ok: false, code, retryable: code === "provider_error", usageRemaining: remaining },
      remaining,
    );
  }
}

export async function GET(request: Request): Promise<Response> {
  const resolved = resolveOpenAIApiKey(request);
  return Response.json({
    liveConfigured: resolved.source !== "none" && Boolean(aiUsageSecret()),
    transcribeModel: captureTranscribeModel(),
    usageMax: CAPTURE_USAGE_MAX,
  });
}

/**
 * Structural check rather than `instanceof File`: the File produced by
 * `formData()` comes from undici and does not match every runtime's global.
 */
function isUploadedAudio(value: unknown): value is File {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as Blob).arrayBuffer === "function" &&
    typeof (value as Blob).size === "number"
  );
}

function isOpenAIAuthError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "status" in error && (error as { status?: number }).status === 401;
}
