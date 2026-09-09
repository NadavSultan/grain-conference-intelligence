import type { TimelineEntry } from "@/domain/types";
import type { CopilotEvidenceContext } from "@/features/copilot/schema";

export const COPILOT_SYSTEM_PROMPT = [
  "You interpret stored conference-intelligence evidence and draft optional follow-up copy.",
  "Use only provided IDs and facts. Do not invent people, meetings, emails, or evidence IDs.",
  "Separate sourced fact from relevance inference.",
  "Public activity is context, not buying progression.",
  "Expose counterevidence. Do not decide contact identity. Do not send anything.",
  "Return state unclear whenever deterministic eligibility does not support warming or stalled.",
  "Cite only encounter IDs from actual saved meetings and research evidence IDs belonging to this person or company.",
  "If no usable email channel exists, followUpDraft must be null. If no LinkedIn channel exists, linkedInDraft must be null.",
].join(" ");

export function copilotUserPrompt(input: {
  context: CopilotEvidenceContext;
  timeline: TimelineEntry[];
  evidence: Array<{ id: string; personId: string | null; companyId: string; claim?: string }>;
}): string {
  return JSON.stringify(
    {
      personId: input.context.personId,
      companyId: input.context.companyId,
      eligibility: input.context.eligibility,
      allowedEncounterIds: input.context.allowedEncounterIds,
      allowedSignalIds: input.context.allowedSignalIds,
      canDraftEmail: input.context.canDraftEmail,
      canDraftLinkedIn: input.context.canDraftLinkedIn,
      timeline: input.timeline.map((entry) => ({
        id: entry.id,
        kind: entry.kind,
        occurredAt: entry.occurredAt,
        summary: entry.summary,
        nextStep: entry.nextStep ?? null,
        reciprocal: entry.reciprocal ?? false,
      })),
      evidence: input.evidence.filter((item) =>
        input.context.allowedSignalIds.includes(item.id),
      ),
    },
    null,
    2,
  );
}
