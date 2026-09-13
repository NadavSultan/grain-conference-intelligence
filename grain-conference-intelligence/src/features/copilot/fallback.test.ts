import { describe, expect, it } from "vitest";

import { createDemoWorkspace } from "@/data/demo-workspace";
import { PROFILES } from "@/data/prep-snapshots";
import { deriveRelationshipEligibility } from "@/features/relationships/eligibility";
import { buildFallbackBrief } from "@/features/copilot/fallback";
import type { CopilotEvidenceContext } from "@/features/copilot/schema";

function contextFor(personId: "marcus" | "sam" | "priya", canDraftEmail: boolean): CopilotEvidenceContext {
  const seed = createDemoWorkspace();
  const profile = PROFILES[personId];
  const timeline = seed.timeline.filter((entry) => entry.personId === personId);
  const companyId =
    personId === "marcus" ? "payloom" : personId === "sam" ? "acme-payments" : "lumio-marketplace";
  return {
    personId,
    companyId,
    eligibility: deriveRelationshipEligibility(timeline),
    allowedEncounterIds: timeline
      .filter((entry) => entry.kind === "actual_encounter")
      .map((entry) => entry.id),
    allowedSignalIds: profile.evidence.map((item) => item.id),
    canDraftEmail,
    canDraftLinkedIn: true,
  };
}

describe("deterministic copilot fallback", () => {
  it("never upgrades deterministic eligibility", () => {
    const marcus = contextFor("marcus", true);
    expect(marcus.eligibility.state).toBe("unclear");
    expect(buildFallbackBrief(marcus).state).toBe("unclear");
  });

  it("names the actual encounter count without exposing raw evidence IDs in the summary", () => {
    const marcus = contextFor("marcus", true);
    const brief = buildFallbackBrief(marcus);
    expect(brief.summary).toContain(String(marcus.eligibility.encounterCount));
    expect(brief.summary).not.toMatch(/available evidence|encounter IDs|research evidence IDs/i);
    expect(brief.evidenceEncounterIds.every((id) => marcus.allowedEncounterIds.includes(id))).toBe(
      true,
    );
    expect(brief.evidenceSignalIds.every((id) => marcus.allowedSignalIds.includes(id))).toBe(true);
    expect(brief.counterEvidence.length).toBeGreaterThan(0);
  });

  it("includes counterevidence from eligibility", () => {
    const marcus = contextFor("marcus", true);
    const brief = buildFallbackBrief(marcus);
    expect(brief.counterEvidence.join(" ")).toMatch(/actual saved meetings|Public activity|follow-up/i);
  });

  it("produces no email draft for Priya", () => {
    const brief = buildFallbackBrief(contextFor("priya", false));
    expect(brief.followUpDraft).toBeNull();
  });

  it("produces no email draft for unverified-email-only Sam", () => {
    const brief = buildFallbackBrief(contextFor("sam", false));
    expect(brief.followUpDraft).toBeNull();
  });
});
