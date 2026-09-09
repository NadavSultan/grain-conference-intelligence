import type { RelationshipBrief } from "@/domain/types";
import type { CopilotEvidenceContext } from "@/features/copilot/schema";

export function buildFallbackBrief(context: CopilotEvidenceContext): RelationshipBrief {
  const encounterIds = context.allowedEncounterIds;
  const signalPreview = context.allowedSignalIds.slice(0, 8);
  const summary = [
    `Deterministic eligibility is ${context.eligibility.state} with ${context.eligibility.encounterCount} actual encounter(s).`,
    encounterIds.length > 0
      ? `Encounter IDs: ${encounterIds.join(", ")}.`
      : "No actual meetings are stored.",
    signalPreview.length > 0
      ? `Available evidence IDs: ${context.allowedSignalIds.join(", ")}.`
      : "No research evidence IDs are in scope.",
  ].join(" ");

  return {
    state: context.eligibility.state,
    confidence: context.eligibility.state === "unclear" ? 0.35 : 0.55,
    summary,
    evidenceEncounterIds: encounterIds,
    evidenceSignalIds: signalPreview,
    suggestedAngle: {
      fact:
        encounterIds[0]
          ? `The latest sourced encounter id is ${encounterIds[encounterIds.length - 1]}.`
          : "No actual encounter is stored for this person.",
      evidenceIds: encounterIds[0]
        ? [encounterIds[encounterIds.length - 1]]
        : signalPreview.slice(0, 1),
      relevanceInference:
        "Public activity and unanswered outreach are context. They do not by themselves prove buying progression.",
    },
    counterEvidence: context.eligibility.counterEvidence,
    recommendedAction:
      context.eligibility.state === "unclear"
        ? "Ask one qualification question about current FX process before investing more cycle time?"
        : context.eligibility.state === "stalled"
          ? "Ask whether anything material changed since the last meeting before another follow-up."
          : "Confirm the agreed next step and keep the relationship read tied to that meeting.",
    followUpDraft: context.canDraftEmail
      ? {
          subject: "Quick question before the conference",
          body: "Has anything changed in how you handle emerging-market FX since we last spoke?",
        }
      : null,
    linkedInDraft: context.canDraftLinkedIn
      ? "Saw you listed around the event — is FX still sitting with treasury, or has that shifted?"
      : null,
  };
}
