import OpenAI from "openai";
import { z } from "zod";

import { timelineEntrySchema } from "@/domain/schemas";
import { buildFallbackBrief } from "@/features/copilot/fallback";
import { COPILOT_SYSTEM_PROMPT, copilotUserPrompt } from "@/features/copilot/prompt";
import {
  filterAllowedEvidence,
  parseRelationshipBrief,
  validateRelationshipBrief,
  type CopilotEvidenceContext,
} from "@/features/copilot/schema";
import { resolveOpenAIApiKey } from "@/features/integrations/openai-credentials";
import { deriveRelationshipEligibility } from "@/features/relationships/eligibility";

import { jsonWithUsageCookie, readUsageRemaining } from "./usage";

const evidenceInputSchema = z.object({
  id: z.string().min(1),
  personId: z.string().nullable(),
  companyId: z.string().min(1),
  claim: z.string().optional(),
});

const briefRequestSchema = z.object({
  mode: z.enum(["demo", "live"]),
  personId: z.string().min(1),
  companyId: z.string().min(1),
  timeline: z.array(timelineEntrySchema),
  evidence: z.array(evidenceInputSchema),
  canDraftEmail: z.boolean(),
  canDraftLinkedIn: z.boolean(),
});

type BriefRequest = z.infer<typeof briefRequestSchema>;

export async function GET(request: Request): Promise<Response> {
  const resolved = resolveOpenAIApiKey(request);
  return Response.json({
    liveConfigured: resolved.source !== "none" && Boolean(process.env.AI_USAGE_SECRET),
    model: process.env.OPENAI_MODEL ?? "gpt-5.4-mini",
    hubspotLive: false,
  });
}

export async function POST(request: Request): Promise<Response> {
  const remaining = readUsageRemaining(request.headers.get("cookie"));
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return invalidRequest(remaining);
  }

  const parsed = briefRequestSchema.safeParse(raw);
  if (!parsed.success) {
    return invalidRequest(remaining);
  }

  const body = parsed.data;
  const context = contextFromRequest(body);
  const fallback = buildFallbackBrief(context);

  if (body.mode === "demo") {
    return jsonWithUsageCookie(
      {
        ok: true,
        mode: "demo",
        brief: fallback,
        provider: "deterministic-demo",
        model: "none",
        generatedAt: new Date().toISOString(),
        usageRemaining: remaining,
      },
      remaining,
    );
  }

  if (!process.env.AI_USAGE_SECRET) {
    return Response.json(
      {
        ok: false,
        code: "provider_error",
        retryable: true,
        fallback,
        usageRemaining: remaining,
      },
      { status: 503 },
    );
  }

  const resolved = resolveOpenAIApiKey(request);
  if (!resolved.apiKey) {
    return jsonWithUsageCookie(
      {
        ok: false,
        code: "not_configured",
        retryable: false,
        fallback,
        usageRemaining: remaining,
      },
      remaining,
    );
  }

  if (remaining <= 0) {
    return jsonWithUsageCookie(
      {
        ok: false,
        code: "usage_exhausted",
        retryable: false,
        fallback,
        usageRemaining: 0,
      },
      0,
    );
  }

  const apiKey = resolved.apiKey;
  try {
    const client = new OpenAI({ apiKey });
    const model = process.env.OPENAI_MODEL ?? "gpt-5.4-mini";
    const completion = await client.responses.create(
      {
        model,
        input: [
          { role: "system", content: COPILOT_SYSTEM_PROMPT },
          {
            role: "user",
            content: copilotUserPrompt({
              context,
              timeline: body.timeline,
              evidence: body.evidence,
            }),
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "relationship_brief",
            strict: true,
            schema: relationshipBriefJsonSchema(),
          },
        },
      },
      { timeout: 20_000 },
    );

    const nextRemaining = remaining - 1;
    const parsedBrief = parseRelationshipBrief(parseOutputText(completion.output_text));
    if (!parsedBrief.ok) {
      return jsonWithUsageCookie(
        {
          ok: false,
          code: "invalid_schema",
          retryable: true,
          fallback,
          usageRemaining: nextRemaining,
        },
        nextRemaining,
      );
    }
    const validated = validateRelationshipBrief(parsedBrief.brief, context);
    if (!validated.ok) {
      return jsonWithUsageCookie(
        {
          ok: false,
          code: "unsupported_evidence",
          retryable: false,
          fallback,
          usageRemaining: nextRemaining,
        },
        nextRemaining,
      );
    }

    return jsonWithUsageCookie(
      {
        ok: true,
        mode: "live",
        brief: validated.brief,
        provider: "openai",
        model,
        generatedAt: new Date().toISOString(),
        usageRemaining: nextRemaining,
      },
      nextRemaining,
    );
  } catch (error) {
    if (isOpenAIAuthError(error)) {
      return jsonWithUsageCookie(
        {
          ok: false,
          code: "invalid_credentials",
          retryable: false,
          fallback,
          usageRemaining: remaining,
        },
        remaining,
      );
    }
    return jsonWithUsageCookie(
      {
        ok: false,
        code: "provider_error",
        retryable: true,
        fallback,
        usageRemaining: remaining,
      },
      remaining,
    );
  }
}

function invalidRequest(remaining: number): Response {
  return Response.json(
    { ok: false, code: "invalid_request", retryable: false, fallback: null, usageRemaining: remaining },
    { status: 400 },
  );
}

function contextFromRequest(body: BriefRequest): CopilotEvidenceContext {
  const timeline = body.timeline.filter((entry) => entry.personId === body.personId);
  return {
    personId: body.personId,
    companyId: body.companyId,
    eligibility: deriveRelationshipEligibility(timeline),
    allowedEncounterIds: timeline
      .filter((entry) => entry.kind === "actual_encounter")
      .map((entry) => entry.id),
    allowedSignalIds: filterAllowedEvidence(body.personId, body.companyId, body.evidence),
    canDraftEmail: body.canDraftEmail,
    canDraftLinkedIn: body.canDraftLinkedIn,
  };
}

function isOpenAIAuthError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const candidate = error as { status?: unknown; statusCode?: unknown; code?: unknown; name?: unknown };
  return (
    candidate.status === 401 ||
    candidate.statusCode === 401 ||
    candidate.code === "invalid_api_key" ||
    candidate.name === "AuthenticationError"
  );
}

function parseOutputText(outputText: string): unknown {
  try {
    return JSON.parse(outputText);
  } catch {
    return outputText;
  }
}

function relationshipBriefJsonSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: [
      "state",
      "confidence",
      "summary",
      "evidenceEncounterIds",
      "evidenceSignalIds",
      "suggestedAngle",
      "counterEvidence",
      "recommendedAction",
      "followUpDraft",
      "linkedInDraft",
    ],
    properties: {
      state: { type: "string", enum: ["warming", "stalled", "unclear"] },
      confidence: { type: "number" },
      summary: { type: "string" },
      evidenceEncounterIds: { type: "array", items: { type: "string" } },
      evidenceSignalIds: { type: "array", items: { type: "string" } },
      suggestedAngle: {
        type: "object",
        additionalProperties: false,
        required: ["fact", "evidenceIds", "relevanceInference"],
        properties: {
          fact: { type: "string" },
          evidenceIds: { type: "array", items: { type: "string" } },
          relevanceInference: { type: "string" },
        },
      },
      counterEvidence: { type: "array", items: { type: "string" } },
      recommendedAction: { type: "string" },
      followUpDraft: {
        anyOf: [
          {
            type: "object",
            additionalProperties: false,
            required: ["subject", "body"],
            properties: { subject: { type: "string" }, body: { type: "string" } },
          },
          { type: "null" },
        ],
      },
      linkedInDraft: { type: ["string", "null"] },
    },
  } as const;
}
