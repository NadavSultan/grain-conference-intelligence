import { createHmac, timingSafeEqual } from "node:crypto";

import OpenAI from "openai";

import type { TimelineEntry } from "@/domain/types";
import { buildFallbackBrief } from "@/features/copilot/fallback";
import { COPILOT_SYSTEM_PROMPT, copilotUserPrompt } from "@/features/copilot/prompt";
import {
  filterAllowedEvidence,
  parseRelationshipBrief,
  validateRelationshipBrief,
  type CopilotEvidenceContext,
} from "@/features/copilot/schema";
import { deriveRelationshipEligibility } from "@/features/relationships/eligibility";

export const USAGE_COOKIE = "grain-ai-usage";
const USAGE_MAX = 5;

interface BriefRequest {
  personId: string;
  companyId: string;
  timeline: TimelineEntry[];
  evidence: Array<{ id: string; personId: string | null; companyId: string; claim?: string }>;
  canDraftEmail: boolean;
  canDraftLinkedIn: boolean;
}

export async function GET(): Promise<Response> {
  return Response.json({
    liveConfigured: Boolean(process.env.OPENAI_API_KEY && process.env.AI_USAGE_SECRET),
    model: process.env.OPENAI_MODEL ?? "gpt-5.4-mini",
    hubspotLive: false,
  });
}

export function signUsageCookie(remaining: number): string {
  const normalized = Math.max(0, Math.min(USAGE_MAX, remaining));
  const payload = String(normalized);
  const hmac = createHmac("sha256", secret()).update(payload).digest("hex");
  return `${payload}.${hmac}`;
}

export async function POST(request: Request): Promise<Response> {
  const remaining = readUsageRemaining(request.headers.get("cookie"));
  let body: BriefRequest;
  try {
    body = (await request.json()) as BriefRequest;
  } catch {
    return Response.json(
      { ok: false, code: "invalid_request", retryable: false, fallback: null, usageRemaining: remaining },
      { status: 400 },
    );
  }

  const context = contextFromRequest(body);
  const fallback = buildFallbackBrief(context);

  if (!process.env.OPENAI_API_KEY) {
    return jsonWithCookie(
      {
        ok: false,
        code: "missing_key",
        retryable: false,
        fallback,
        usageRemaining: remaining,
      },
      remaining,
    );
  }

  if (remaining <= 0) {
    return jsonWithCookie(
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

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
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
    const parsed = parseRelationshipBrief(parseOutputText(completion.output_text));
    if (!parsed.ok) {
      return jsonWithCookie(
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
    const validated = validateRelationshipBrief(parsed.brief, context);
    if (!validated.ok) {
      return jsonWithCookie(
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

    return jsonWithCookie(
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
  } catch {
    const nextRemaining = remaining;
    return jsonWithCookie(
      {
        ok: false,
        code: "provider_error",
        retryable: true,
        fallback,
        usageRemaining: nextRemaining,
      },
      nextRemaining,
    );
  }
}

function contextFromRequest(body: BriefRequest): CopilotEvidenceContext {
  const timeline = Array.isArray(body.timeline) ? body.timeline : [];
  const personTimeline = timeline.filter((entry) => entry.personId === body.personId);
  return {
    personId: body.personId,
    companyId: body.companyId,
    eligibility: deriveRelationshipEligibility(personTimeline),
    allowedEncounterIds: personTimeline
      .filter((entry) => entry.kind === "actual_encounter")
      .map((entry) => entry.id),
    allowedSignalIds: filterAllowedEvidence(body.personId, body.companyId, body.evidence ?? []),
    canDraftEmail: Boolean(body.canDraftEmail),
    canDraftLinkedIn: Boolean(body.canDraftLinkedIn),
  };
}

function readUsageRemaining(cookieHeader: string | null): number {
  const raw = cookieValue(cookieHeader, USAGE_COOKIE);
  if (!raw) return USAGE_MAX;
  const [payload, hmac] = raw.split(".");
  if (!payload || !hmac) return USAGE_MAX;
  const expected = createHmac("sha256", secret()).update(payload).digest("hex");
  if (!safeEqual(hmac, expected)) return USAGE_MAX;
  const remaining = Number(payload);
  if (!Number.isInteger(remaining) || remaining < 0 || remaining > USAGE_MAX) return USAGE_MAX;
  return remaining;
}

function jsonWithCookie(payload: unknown, remaining: number): Response {
  const response = Response.json(payload);
  response.headers.set(
    "Set-Cookie",
    `${USAGE_COOKIE}=${signUsageCookie(remaining)}; HttpOnly; Path=/; SameSite=Lax`,
  );
  return response;
}

function cookieValue(header: string | null, name: string): string | undefined {
  if (!header) return undefined;
  const match = header.split(/;\s*/).find((part) => part.startsWith(`${name}=`));
  return match?.slice(name.length + 1);
}

function secret(): string {
  return process.env.AI_USAGE_SECRET ?? "";
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
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
