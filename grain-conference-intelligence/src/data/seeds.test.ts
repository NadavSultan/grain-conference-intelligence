import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { CONFERENCES, audienceSizeLabel } from "@/data/conferences";
import {
  ALL_EVIDENCE,
  EDGE_FIXTURES,
  FULL_PROFILE_IDS,
  PREP_SNAPSHOTS,
  PROFILES,
} from "@/data/prep-snapshots";
import { createDemoWorkspace } from "@/data/demo-workspace";
import { workspaceStateV1Schema } from "@/domain/schemas";

describe("conference source ledger", () => {
  it("contains exactly 12 unique sourced conferences", () => {
    expect(CONFERENCES).toHaveLength(12);
    expect(new Set(CONFERENCES.map((conference) => conference.id)).size).toBe(12);
    expect(
      CONFERENCES.every(
        (conference) => conference.sourceUrl && conference.verifiedAt,
      ),
    ).toBe(true);
  });

  it("provides evidence for every score component", () => {
    const required = [
      "vertical_fit",
      "buyer_role_density",
      "fx_relevance",
      "meeting_accessibility",
      "trip_efficiency",
    ];

    for (const conference of CONFERENCES) {
      expect(conference.scoreEvidence.map((item) => item.component).sort()).toEqual(
        [...required].sort(),
      );
      expect(
        conference.scoreEvidence.every(
          (item) => item.sourceUrl && item.verifiedAt && item.claim,
        ),
      ).toBe(true);
    }
  });

  it("keeps unknown audience values null and displays Unknown", () => {
    const unknown = CONFERENCES.filter((conference) => conference.audienceSize === null);
    expect(unknown.length).toBeGreaterThan(0);
    expect(unknown.every((conference) => audienceSizeLabel(conference) === "Unknown")).toBe(
      true,
    );
  });

  it("keeps the illustrative Money20/20 outreach dates separate from verified facts", () => {
    const verified = CONFERENCES.find((conference) => conference.id === "money20-europe-2027");
    expect(verified?.startDate).toBe("2027-06-08");
    expect(verified?.endDate).toBe("2027-06-10");
    expect(verified?.demoScenarioId).toBe("money20-eu-demo");
    expect(verified?.demoDateWarning).toContain("2–4 June");
  });
});

describe("trusted Prep fixtures", () => {
  it("has two cached Prep conferences and exactly two Money20/20 snapshots", () => {
    expect(new Set(PREP_SNAPSHOTS.map((snapshot) => snapshot.conferenceId)).size).toBe(2);
    expect(
      PREP_SNAPSHOTS.filter(
        (snapshot) => snapshot.conferenceId === "money20-eu-demo",
      ),
    ).toHaveLength(2);
  });

  it("exports exactly four full profile IDs in the approved order", () => {
    expect(FULL_PROFILE_IDS).toEqual(["sam", "david", "priya", "marcus"]);
    expect(Object.keys(PROFILES)).toHaveLength(4);
  });

  it("labels every fictional evidence record independently from its confidence tag", () => {
    const allEvidence = Object.values(PROFILES).flatMap((profile) => profile.evidence);
    expect(allEvidence.every((evidence) => evidence.origin === "fictional_demo")).toBe(true);
    expect(new Set(allEvidence.map((evidence) => evidence.tag))).toEqual(
      new Set(["verified", "cited", "inferred", "unknown"]),
    );
    expect(allEvidence.every((evidence) => evidence.exhibitUrl.startsWith("/evidence/"))).toBe(
      true,
    );
  });

  it("resolves every snapshot evidence reference to one stable fictional exhibit", () => {
    const evidenceIds = ALL_EVIDENCE.map((evidence) => evidence.id);
    const referencedIds = PREP_SNAPSHOTS.flatMap((snapshot) =>
      snapshot.records.flatMap((record) => record.evidenceIds),
    );

    expect(new Set(evidenceIds).size).toBe(evidenceIds.length);
    expect(ALL_EVIDENCE.every((evidence) => evidence.origin === "fictional_demo")).toBe(
      true,
    );
    expect(referencedIds.every((id) => evidenceIds.includes(id))).toBe(true);
  });

  it("labels every local exhibit and supplies dated fixture content", () => {
    for (const filename of ["sam.html", "david.html", "priya.html", "marcus.html", "edge-fixtures.html"]) {
      const exhibit = readFileSync(join(process.cwd(), "public", "evidence", filename), "utf8");
      expect(exhibit).toContain("Fictional demo evidence — not a live public source");
      expect(exhibit).toMatch(/Dated|Recorded|researched on/i);
    }
  });

  it("preserves the four profile-specific presentation corrections", () => {
    expect(PROFILES.sam.contact.email?.confidence).toBe("inferred");
    expect(PROFILES.sam.actions.openEmail).toBe(false);
    expect(PROFILES.priya.contact.email).toBeNull();
    expect(PROFILES.priya.drafts.email).toBeNull();
    expect(PROFILES.david.requiresCoordination).toBe(true);
    expect(PROFILES.marcus.relationshipRead.label).toBe("Illustrative hypothesis");
    expect(PROFILES.marcus.relationshipRead.counterEvidence).toContain(
      "No reply to the second follow-up eight months ago.",
    );
    expect(Object.values(PROFILES).every((profile) => profile.fictionalLabel === "Fictional demo scenario")).toBe(true);
  });

  it("retains complete working material for every full profile", () => {
    for (const profile of Object.values(PROFILES)) {
      expect(profile.whyThisPersonMatters.length).toBeGreaterThanOrEqual(3);
      expect(profile.recentSignals.length).toBeGreaterThanOrEqual(3);
      expect(profile.suggestedAngle.length).toBeGreaterThan(120);
      expect(profile.nextAction.length).toBeGreaterThan(30);
      expect(
        Object.values(profile.drafts).filter((draft) => draft !== null).length,
      ).toBeGreaterThan(0);
      expect(profile.scheduleWarning).toContain("review before real outreach");
    }
  });

  it("starts Marcus with one actual encounter and one planned meeting", () => {
    const workspace = createDemoWorkspace();
    const marcusTimeline = workspace.timeline.filter(
      (entry) => entry.personId === "marcus",
    );
    expect(
      marcusTimeline.filter(
        (entry) => entry.personId === "marcus" && entry.kind === "actual_encounter",
      ),
    ).toHaveLength(1);
    expect(
      workspace.plannedMeetings.filter((meeting) => meeting.personId === "marcus"),
    ).toHaveLength(1);
    expect(marcusTimeline.map((entry) => entry.kind)).toEqual([
      "actual_encounter",
      "outreach_sent",
      "reply",
      "outreach_sent",
      "research_observation",
    ]);
  });

  it("hydrates the trusted demo workspace with cached snapshots and profile statuses", () => {
    const workspace = createDemoWorkspace();

    expect(workspace.activeSnapshotIds).toEqual({
      "money20-eu-demo": "money20-eu-demo-snapshot-1",
      "eurofinance-2026": "eurofinance-demo-snapshot-1",
    });
    expect(
      FULL_PROFILE_IDS.map(
        (personId) => workspace.prepStatuses[`money20-eu-demo:${personId}`],
      ),
    ).toEqual(["to_contact", "to_contact", "to_contact", "to_contact"]);
  });

  it("reuses stable evidence IDs across Money20/20 snapshots", () => {
    const [first, second] = PREP_SNAPSHOTS.filter(
      (snapshot) => snapshot.conferenceId === "money20-eu-demo",
    );
    const firstAttendance = first.records.find((record) => record.personId === "sam")
      ?.evidenceIds[0];
    const secondAttendance = second.records.find((record) => record.personId === "sam")
      ?.evidenceIds[0];

    expect(firstAttendance).toBe("sam-attendance-linkedin");
    expect(secondAttendance).toBe(firstAttendance);
    expect(new Set(second.records.flatMap((record) => record.evidenceIds)).size).toBe(
      second.records.flatMap((record) => record.evidenceIds).length,
    );
    expect(first.researchedAt).not.toBe(second.researchedAt);
    expect(second.simulatedAt).toBeNull();
  });
});

describe("compact edge fixtures", () => {
  it("includes every requested edge without a fifth full profile", () => {
    expect(EDGE_FIXTURES.openDeal.crmState).toBe("open_deal");
    expect(EDGE_FIXTURES.probableReturner.attendanceConfidence).toBe(
      "probable_returner",
    );
    expect(EDGE_FIXTURES.companyOnly.personId).toBeNull();
    expect(EDGE_FIXTURES.cancelledSpeaker.cancelled).toBe(true);
    expect(EDGE_FIXTURES.unknownCrm.crmState).toBe("unknown");
    expect(EDGE_FIXTURES.namesakeDomain.reviewRequired).toBe(true);
    expect(EDGE_FIXTURES.jobChange.previousCompany).not.toBe(
      EDGE_FIXTURES.jobChange.currentCompany,
    );
  });

  it("models a genuinely stalled relationship with three actual encounters over 180 days", () => {
    const encounters = EDGE_FIXTURES.stalled.timeline.filter(
      (entry) => entry.kind === "actual_encounter",
    );
    const span =
      new Date(encounters.at(-1)?.occurredAt ?? 0).getTime() -
      new Date(encounters[0]?.occurredAt ?? 0).getTime();
    expect(encounters).toHaveLength(3);
    expect(span / 86_400_000).toBeGreaterThanOrEqual(180);
    expect(EDGE_FIXTURES.stalled.progression).toBe("none");
  });

  it("creates a schema-valid workspace from the trusted fixtures", () => {
    expect(workspaceStateV1Schema.safeParse(createDemoWorkspace()).success).toBe(true);
  });
});
