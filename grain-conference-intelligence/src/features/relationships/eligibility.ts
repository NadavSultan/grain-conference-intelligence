import type { TimelineEntry } from "@/domain/types";

export type EligibilityState = "warming" | "stalled" | "unclear";

export interface RelationshipEligibility {
  state: EligibilityState;
  encounterCount: number;
  spanDays: number;
  counterEvidence: string[];
}

export function deriveRelationshipEligibility(
  timeline: TimelineEntry[],
): RelationshipEligibility {
  const encounters = timeline
    .filter((entry) => entry.kind === "actual_encounter")
    .sort((left, right) => left.occurredAt.localeCompare(right.occurredAt));
  const encounterCount = encounters.length;
  const spanDays =
    encounters.length >= 2
      ? Math.round(
          (Date.parse(encounters[encounters.length - 1].occurredAt) -
            Date.parse(encounters[0].occurredAt)) /
            86_400_000,
        )
      : 0;
  const progression = encounters.some(
    (entry) => entry.reciprocal === true || isConcreteNextStep(entry.nextStep),
  );
  const counterEvidence = counterEvidenceFrom(timeline, encounters);

  if (encounterCount >= 3 && spanDays >= 180 && !progression) {
    return { state: "stalled", encounterCount, spanDays, counterEvidence };
  }
  if (progression) {
    return { state: "warming", encounterCount, spanDays, counterEvidence };
  }
  return { state: "unclear", encounterCount, spanDays, counterEvidence };
}

function isConcreteNextStep(nextStep: string | undefined): boolean {
  return Boolean(nextStep && nextStep.trim().length > 0);
}

function counterEvidenceFrom(
  timeline: TimelineEntry[],
  encounters: TimelineEntry[],
): string[] {
  const evidence: string[] = [];
  if (timeline.some((entry) => entry.kind === "outreach_sent")) {
    evidence.push("Unanswered or delayed outbound follow-up is not buying progression.");
  }
  if (timeline.some((entry) => entry.kind === "research_observation")) {
    evidence.push("Public activity is context, not a meeting or reciprocal commitment.");
  }
  if (encounters.length < 2) {
    evidence.push("Only actual saved meetings increment encounter count.");
  }
  return evidence;
}
