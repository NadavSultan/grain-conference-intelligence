import { relationshipBriefSchema } from "@/domain/schemas";
import type { RelationshipBrief } from "@/domain/types";
import type { RelationshipEligibility } from "@/features/relationships/eligibility";

export interface CopilotEvidenceContext {
  personId: string;
  companyId: string;
  eligibility: RelationshipEligibility;
  allowedEncounterIds: string[];
  allowedSignalIds: string[];
  canDraftEmail: boolean;
  canDraftLinkedIn: boolean;
}

export type BriefParseResult =
  | { ok: true; brief: RelationshipBrief }
  | { ok: false; reasons: string[] };

export function parseRelationshipBrief(input: unknown): BriefParseResult {
  const parsed = relationshipBriefSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, reasons: parsed.error.issues.map((issue) => issue.message) };
  }
  return { ok: true, brief: parsed.data };
}

export function validateRelationshipBrief(
  brief: RelationshipBrief,
  context: CopilotEvidenceContext,
): BriefParseResult {
  const reasons: string[] = [];
  const allowedEncounters = new Set(context.allowedEncounterIds);
  const allowedSignals = new Set(context.allowedSignalIds);
  const allowedAngle = new Set([...allowedEncounters, ...allowedSignals]);

  if (brief.confidence < 0 || brief.confidence > 1) {
    reasons.push("confidence must be between 0 and 1");
  }

  for (const id of brief.evidenceEncounterIds) {
    if (!allowedEncounters.has(id)) reasons.push(`unknown or foreign encounter ${id}`);
  }
  for (const id of brief.evidenceSignalIds) {
    if (!allowedSignals.has(id)) reasons.push(`unknown or foreign signal ${id}`);
  }
  for (const id of brief.suggestedAngle.evidenceIds) {
    if (!allowedAngle.has(id)) reasons.push(`unknown or foreign angle evidence ${id}`);
  }

  if (brief.state === "warming" && context.eligibility.state !== "warming") {
    reasons.push("warming is not supported by deterministic eligibility");
  }
  if (brief.state === "stalled" && context.eligibility.state !== "stalled") {
    reasons.push("stalled is not supported by deterministic eligibility");
  }
  if (brief.state === "stalled" && (context.eligibility.encounterCount < 3 || context.eligibility.spanDays < 180)) {
    reasons.push("stalled requires three actual encounters spanning 180 days");
  }

  if (brief.followUpDraft && !context.canDraftEmail) {
    reasons.push("email draft is unsupported without a usable email channel");
  }
  if (brief.linkedInDraft && !context.canDraftLinkedIn) {
    reasons.push("LinkedIn draft is unsupported without a usable LinkedIn channel");
  }

  if (reasons.length > 0) return { ok: false, reasons };
  return { ok: true, brief };
}

export function filterAllowedEvidence(
  personId: string,
  companyId: string,
  evidence: Array<{ id: string; personId: string | null; companyId: string }>,
): string[] {
  return evidence
    .filter(
      (item) =>
        item.personId === personId || (item.personId === null && item.companyId === companyId),
    )
    .map((item) => item.id);
}
