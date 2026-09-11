import OpenAI from "openai";
import { z } from "zod";

import {
  CAPTURE_SYSTEM_PROMPT,
  captureExtractionJsonSchema,
  captureExtractionModel,
  captureUserPrompt,
  filledFields,
  parseCaptureExtraction,
} from "@/features/capture/voice-extraction";
import { isSameOrigin, resolveOpenAIApiKey } from "@/features/integrations/openai-credentials";

import { jsonWithCaptureUsage, readCaptureUsage } from "../usage";

const extractRequestSchema = z.object({
  transcript: z.string().min(1).max(8000),
});

export async function POST(request: Request): Promise<Response> {
  if (!isSameOrigin(request)) {
    return Response.json({ ok: false, code: "forbidden", retryable: false }, { status: 403 });
  }

  const contentType = request.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase();
  if (contentType !== "application/json") {
    return Response.json({ ok: false, code: "invalid_request", retryable: false }, { status: 415 });
  }

  if (!process.env.AI_USAGE_SECRET) {
    return Response.json({ ok: false, code: "provider_error", retryable: true }, { status: 503 });
  }

  const remaining = readCaptureUsage(request.headers.get("cookie"));

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return Response.json({ ok: false, code: "invalid_request", retryable: false }, { status: 400 });
  }

  const parsed = extractRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return Response.json({ ok: false, code: "invalid_request", retryable: false }, { status: 400 });
  }

  const resolved = resolveOpenAIApiKey(request);
  if (!resolved.apiKey) {
    return jsonWithCaptureUsage(
      { ok: false, code: "not_configured", retryable: false, usageRemaining: remaining },
      remaining,
    );
  }

  if (remaining <= 0) {
    return jsonWithCaptureUsage(
      { ok: false, code: "usage_exhausted", retryable: false, usageRemaining: 0 },
      0,
    );
  }

  const model = captureExtractionModel();
  try {
    const client = new OpenAI({ apiKey: resolved.apiKey });
    const completion = await client.responses.create(
      {
        model,
        store: false,
        reasoning: { effort: "low" },
        input: [
          { role: "system", content: CAPTURE_SYSTEM_PROMPT },
          { role: "user", content: captureUserPrompt(parsed.data.transcript) },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "capture_extraction",
            strict: true,
            schema: captureExtractionJsonSchema(),
          },
        },
      },
      { timeout: 20_000 },
    );

    const nextRemaining = remaining - 1;
    const extraction = parseCaptureExtraction(parseOutputText(completion.output_text));
    if (!extraction.ok) {
      return jsonWithCaptureUsage(
        { ok: false, code: "invalid_schema", retryable: true, usageRemaining: nextRemaining },
        nextRemaining,
      );
    }

    return jsonWithCaptureUsage(
      {
        ok: true,
        extraction: extraction.extraction,
        filled: filledFields(extraction.extraction),
        model,
        generatedAt: new Date().toISOString(),
        usageRemaining: nextRemaining,
      },
      nextRemaining,
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
    liveConfigured: resolved.source !== "none" && Boolean(process.env.AI_USAGE_SECRET),
    extractionModel: captureExtractionModel(),
  });
}

function parseOutputText(outputText: string): unknown {
  try {
    return JSON.parse(outputText);
  } catch {
    return outputText;
  }
}

function isOpenAIAuthError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "status" in error && (error as { status?: number }).status === 401;
}
