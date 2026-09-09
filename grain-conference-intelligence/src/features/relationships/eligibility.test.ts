import { describe, expect, it } from "vitest";

import { createDemoWorkspace } from "@/data/demo-workspace";
import { EDGE_FIXTURES } from "@/data/prep-snapshots";
import { deriveRelationshipEligibility } from "@/features/relationships/eligibility";
import type { TimelineEntry } from "@/domain/types";

describe("typed history and eligibility", () => {
  it("does not count research, outreach, replies, or planned meetings as encounters", () => {
    const seed = createDemoWorkspace();
    const marcus = seed.timeline.filter((entry) => entry.personId === "marcus");
    const eligibility = deriveRelationshipEligibility(marcus);

    expect(marcus.some((entry) => entry.kind === "research_observation")).toBe(true);
    expect(marcus.some((entry) => entry.kind === "outreach_sent")).toBe(true);
    expect(marcus.some((entry) => entry.kind === "reply")).toBe(true);
    expect(seed.plannedMeetings.some((meeting) => meeting.personId === "marcus")).toBe(true);
    expect(eligibility.encounterCount).toBe(1);
    expect(eligibility.state).toBe("unclear");
  });

  it("marks stalled only for three actual encounters over at least 180 days with no progression", () => {
    const stalled = deriveRelationshipEligibility(EDGE_FIXTURES.stalled.timeline);
    expect(stalled.encounterCount).toBe(3);
    expect(stalled.spanDays).toBeGreaterThanOrEqual(180);
    expect(stalled.state).toBe("stalled");
  });

  it("keeps Marcus unclear until a captured reciprocal or concrete next step", () => {
    const seed = createDemoWorkspace();
    const before = deriveRelationshipEligibility(
      seed.timeline.filter((entry) => entry.personId === "marcus"),
    );
    expect(before.state).toBe("unclear");
    expect(before.counterEvidence.length).toBeGreaterThan(0);

    const captured: TimelineEntry[] = [
      ...seed.timeline.filter((entry) => entry.personId === "marcus"),
      {
        id: "enc-marcus-current",
        personId: "marcus",
        companyId: "payloom",
        conferenceId: "money20-eu-demo",
        kind: "actual_encounter",
        occurredAt: "2026-06-03T12:00:00.000Z",
        summary: "Agreed a corridor walkthrough next Tuesday.",
        company: "Payloom",
        role: "Treasury Director",
        plannedMeetingId: "pm-marcus",
        nextStep: "Corridor walkthrough next Tuesday",
        reciprocal: true,
      },
    ];

    expect(deriveRelationshipEligibility(captured).state).toBe("warming");
  });
});
