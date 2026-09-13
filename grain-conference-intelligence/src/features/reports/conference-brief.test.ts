import { describe, expect, it } from "vitest";

import { createDemoWorkspace } from "@/data/demo-workspace";
import { CACHED_MARCUS_BRIEF } from "@/features/copilot/cached-marcus";
import {
  buildConferenceBrief,
  type ConferenceBriefReport,
} from "@/features/reports/conference-brief";
import type { StoredCopilotBrief, WorkspaceStateV1 } from "@/domain/types";

function reportFor(
  conferenceId: string,
  state: WorkspaceStateV1 = createDemoWorkspace(),
): ConferenceBriefReport {
  const result = buildConferenceBrief(conferenceId, state);
  expect(result.status).toBe("ready");
  if (result.status !== "ready") throw new Error("expected a report");
  return result.report;
}

describe("buildConferenceBrief", () => {
  it("builds the seeded Money20/20 Europe report from current records and workspace state", () => {
    const report = reportFor("money20-europe-2027");

    expect(report.name).toBe("Money20/20 Europe");
    expect(report.startDate).toBe("2027-06-08");
    expect(report.endDate).toBe("2027-06-10");
    expect(report.location).toBe("The RAI, Amsterdam, Netherlands");
    expect(report.sourceUrl).toBe("https://europe.money2020.com/attend");
    expect(report.demoWarning).toContain("illustrative 2–4 June");

    expect(report.score.total).toBe(83);
    expect(report.score.tier).toBe("A");
    expect(report.recommendation).toBe("attend");

    expect(report.plan.decision).toBe("undecided");
    expect(report.plan.owner).toBeNull();

    expect(report.prep.available).toBe(true);
    expect(report.prep.summary).toEqual({
      attendeesVerified: 6,
      relevant: 5,
      readyToContact: 3,
      needCoordination: 1,
    });

    expect(report.priorityContacts.map((contact) => contact.name)).toEqual([
      "David Cohen",
      "Marcus Oyelaran",
      "Sam Jones",
      "Priya Natarajan",
    ]);
    expect(report.priorityContacts.map((contact) => contact.outreachStatus)).toEqual([
      "to_contact",
      "to_contact",
      "to_contact",
      "to_contact",
    ]);

    expect(report.meetings).toEqual([
      expect.objectContaining({
        id: "pm-marcus",
        personId: "marcus",
        personName: "Marcus Oyelaran",
        scheduledFor: "2026-06-03T11:30:00.000Z",
        context: "Planned second encounter after the illustrative fireside chat.",
        outcome: "planned",
      }),
    ]);
  });

  it("includes complete scoring breakdown with rationale, source, and verification date", () => {
    const report = reportFor("money20-europe-2027");
    const trip = report.score.components.find((item) => item.component === "trip_efficiency");
    const vertical = report.score.components.find((item) => item.component === "vertical_fit");

    expect(report.score.components).toHaveLength(5);
    expect(vertical).toMatchObject({
      points: 35,
      max: 35,
      status: "sourced",
      rationale:
        "The organizer describes a fintech audience spanning banks, payments, technology, startups, retail, policy, crypto, and cybersecurity.",
      sourceUrl: "https://europe.money2020.com/attend",
      verifiedAt: "2026-09-09",
    });
    expect(trip).toMatchObject({
      points: 0,
      status: "unknown",
      sourceUrl: "https://europe.money2020.com/attend",
      verifiedAt: "2026-09-09",
    });
    expect(trip?.rationale).toContain("Unknown");
  });

  it("shows saved Copilot recommendations and honest empty entries for relevant people", () => {
    const empty = reportFor("money20-europe-2027");
    expect(empty.copilot.map((entry) => entry.personId)).toEqual([
      "david",
      "marcus",
      "sam",
      "priya",
    ]);
    expect(empty.copilot.every((entry) => entry.stored === null)).toBe(true);

    const stored: StoredCopilotBrief = {
      personId: "marcus",
      mode: "demo",
      provider: "deterministic-demo",
      model: "none",
      generatedAt: "2026-05-20T09:00:00.000Z",
      brief: CACHED_MARCUS_BRIEF,
    };
    const withBrief = reportFor("money20-europe-2027", {
      ...createDemoWorkspace(),
      copilotBriefs: { marcus: stored },
    });

    expect(withBrief.copilot.find((entry) => entry.personId === "marcus")?.stored).toEqual(stored);
    expect(withBrief.copilot.filter((entry) => entry.personId !== "marcus").every((entry) => entry.stored === null)).toBe(
      true,
    );
  });

  it("does not use cached Copilot examples that were never saved in workspace state", () => {
    const report = reportFor("money20-europe-2027");
    const marcus = report.copilot.find((entry) => entry.personId === "marcus");
    expect(marcus?.stored).toBeNull();
    expect(JSON.stringify(report)).not.toContain(CACHED_MARCUS_BRIEF.summary);
  });

  it("produces a valid report for a conference without Prep data and does not fabricate counts", () => {
    const report = reportFor("money20-usa-2026");

    expect(report.name).toBe("Money20/20 USA");
    expect(report.prep.available).toBe(false);
    expect(report.prep.summary).toBeNull();
    expect(report.priorityContacts).toEqual([]);
    expect(report.meetings).toEqual([]);
    expect(report.copilot).toEqual([]);
    expect(report.plan.decision).toBe("attend");
    expect(report.plan.owner).toBe("Nadav");
    expect(report.score.q).toBeNull();
    expect(report.score.researchedRoomStatus).toBe("unknown");
  });

  it("does not export unlabeled edge fixtures or internal IDs as priority contacts", () => {
    const report = reportFor("money20-europe-2027");
    const serialized = JSON.stringify(report.priorityContacts);

    expect(report.priorityContacts.map((contact) => contact.personId)).toEqual([
      "david",
      "marcus",
      "sam",
      "priya",
    ]);
    expect(serialized).not.toContain("edge-changed");
    expect(report.priorityContacts.every((contact) => contact.fictionalLabel === "Fictional demo scenario")).toBe(
      true,
    );
    expect(report.prep.summary?.relevant).toBe(5);
  });

  it("returns not_found for unknown conference IDs", () => {
    expect(buildConferenceBrief("not-a-conference", createDemoWorkspace())).toEqual({
      status: "not_found",
    });
  });
});
