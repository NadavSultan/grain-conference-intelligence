import { describe, expect, it } from "vitest";

import { createDemoWorkspace } from "@/data/demo-workspace";
import { EDGE_FIXTURES } from "@/data/prep-snapshots";
import { deriveRelationshipEligibility } from "@/features/relationships/eligibility";
import {
  parseRelationshipBrief,
  validateRelationshipBrief,
  type CopilotEvidenceContext,
} from "@/features/copilot/schema";
import type { RelationshipBrief } from "@/domain/types";

function marcusContext(): CopilotEvidenceContext {
  const seed = createDemoWorkspace();
  const timeline = seed.timeline.filter((entry) => entry.personId === "marcus");
  return {
    personId: "marcus",
    companyId: "payloom",
    eligibility: deriveRelationshipEligibility(timeline),
    allowedEncounterIds: timeline
      .filter((entry) => entry.kind === "actual_encounter")
      .map((entry) => entry.id),
    allowedSignalIds: [
      "marcus-speaker-current",
      "marcus-warming-hypothesis",
      "marcus-series-c",
      "marcus-email",
    ],
    canDraftEmail: true,
    canDraftLinkedIn: true,
  };
}

function unclearBrief(overrides: Partial<RelationshipBrief> = {}): RelationshipBrief {
  return {
    state: "unclear",
    confidence: 0.42,
    summary: "One actual meeting plus unanswered follow-up does not establish warming.",
    evidenceEncounterIds: ["enc-marcus-money20-prior"],
    evidenceSignalIds: ["marcus-speaker-current"],
    suggestedAngle: {
      fact: "Marcus is listed on the fictional current-edition speakers page.",
      evidenceIds: ["marcus-speaker-current"],
      relevanceInference: "Public speaking is context for a qualification question, not buying progression.",
    },
    counterEvidence: ["Unanswered outbound follow-up is not buying progression."],
    recommendedAction: "Ask whether new corridors changed how Payloom handles emerging-market FX?",
    followUpDraft: null,
    linkedInDraft: null,
    ...overrides,
  };
}

describe("relationship brief schema", () => {
  it("rejects confidence outside 0–1", () => {
    expect(parseRelationshipBrief(unclearBrief({ confidence: 1.2 })).ok).toBe(false);
    expect(parseRelationshipBrief(unclearBrief({ confidence: -0.1 })).ok).toBe(false);
  });

  it("rejects unknown encounter and signal IDs", () => {
    const context = marcusContext();
    expect(
      validateRelationshipBrief(unclearBrief({ evidenceEncounterIds: ["missing-encounter"] }), context)
        .ok,
    ).toBe(false);
    expect(
      validateRelationshipBrief(unclearBrief({ evidenceSignalIds: ["missing-signal"] }), context).ok,
    ).toBe(false);
  });

  it("rejects IDs belonging to another contact or company", () => {
    const context = marcusContext();
    expect(
      validateRelationshipBrief(unclearBrief({ evidenceSignalIds: ["sam-attendance-linkedin"] }), context)
        .ok,
    ).toBe(false);
  });

  it("rejects warming when deterministic eligibility is not warming", () => {
    const context = marcusContext();
    expect(context.eligibility.state).toBe("unclear");
    expect(validateRelationshipBrief(unclearBrief({ state: "warming" }), context).ok).toBe(false);
  });

  it("rejects stalled without three actual encounters over 180 days", () => {
    const context = marcusContext();
    expect(validateRelationshipBrief(unclearBrief({ state: "stalled" }), context).ok).toBe(false);
  });

  it("rejects unsupported email drafts when no usable email channel exists", () => {
    const context: CopilotEvidenceContext = {
      ...marcusContext(),
      personId: "priya",
      companyId: "lumio-marketplace",
      canDraftEmail: false,
      canDraftLinkedIn: true,
    };
    expect(
      validateRelationshipBrief(
        unclearBrief({
          evidenceEncounterIds: [],
          followUpDraft: { subject: "Quick question", body: "Who holds the FX?" },
        }),
        context,
      ).ok,
    ).toBe(false);
  });

  it("accepts a valid unclear brief with a qualification question and null email draft", () => {
    const context: CopilotEvidenceContext = {
      ...marcusContext(),
      canDraftEmail: false,
    };
    const parsed = parseRelationshipBrief(unclearBrief());
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const validated = validateRelationshipBrief(parsed.brief, context);
    expect(validated.ok).toBe(true);
    if (validated.ok) {
      expect(validated.brief.state).toBe("unclear");
      expect(validated.brief.followUpDraft).toBeNull();
      expect(validated.brief.recommendedAction).toMatch(/\?/);
    }
  });

  it("accepts stalled only when eligibility is stalled", () => {
    const stalled = deriveRelationshipEligibility(EDGE_FIXTURES.stalled.timeline);
    const context: CopilotEvidenceContext = {
      personId: "edge-stalled-person",
      companyId: "fictional-co",
      eligibility: stalled,
      allowedEncounterIds: EDGE_FIXTURES.stalled.timeline.map((entry) => entry.id),
      allowedSignalIds: [],
      canDraftEmail: false,
      canDraftLinkedIn: false,
    };
    const brief = unclearBrief({
      state: "stalled",
      evidenceEncounterIds: ["edge-stalled-enc-1", "edge-stalled-enc-2", "edge-stalled-enc-3"],
      evidenceSignalIds: [],
      suggestedAngle: {
        fact: "Three actual meetings spanned more than 180 days.",
        evidenceIds: ["edge-stalled-enc-1"],
        relevanceInference: "Repeat attendance without a next step is not warming.",
      },
      recommendedAction: "Ask one qualification question before investing more cycle time.",
    });
    expect(validateRelationshipBrief(brief, context).ok).toBe(true);
  });
});
