import { describe, expect, it } from "vitest";

import type {
  ConferenceRecord,
  PrepSnapshot,
  PrepSnapshotRecord,
} from "@/domain/types";
import {
  appendScoreSnapshot,
  calculateConferenceScore,
  calculateQualifiedRoomCount,
  deriveTier,
  recommendDecision,
  roomEvidencePoints,
} from "@/features/conferences/scoring";

function makeConference(
  overrides: Partial<ConferenceRecord> = {},
): ConferenceRecord {
  return {
    id: "test-conference",
    name: "Test Conference",
    edition: "2026",
    startDate: "2026-10-18",
    endDate: "2026-10-21",
    location: "The Venetian, Las Vegas, Nevada, USA",
    geography: "North America",
    vertical: "fintech",
    sourceUrl: "https://example.test/conference",
    verifiedAt: "2026-09-09",
    audienceSize: 11000,
    audienceSizeSource: "https://example.test/conference",
    scoreEvidence: [
      {
        id: "test-conference:vertical_fit",
        component: "vertical_fit",
        claim: "Sourced vertical claim.",
        sourceUrl: "https://example.test/vertical",
        verifiedAt: "2026-09-09",
        tag: "verified",
      },
      {
        id: "test-conference:buyer_role_density",
        component: "buyer_role_density",
        claim: "Sourced buyer-role claim.",
        sourceUrl: "https://example.test/buyers",
        verifiedAt: "2026-09-09",
        tag: "verified",
      },
      {
        id: "test-conference:fx_relevance",
        component: "fx_relevance",
        claim: "Sourced FX claim.",
        sourceUrl: "https://example.test/fx",
        verifiedAt: "2026-09-09",
        tag: "verified",
      },
      {
        id: "test-conference:meeting_accessibility",
        component: "meeting_accessibility",
        claim: "Sourced meeting claim.",
        sourceUrl: "https://example.test/meetings",
        verifiedAt: "2026-09-09",
        tag: "verified",
      },
      {
        id: "test-conference:trip_efficiency",
        component: "trip_efficiency",
        claim: "Trip efficiency remains Unknown.",
        sourceUrl: "https://example.test/trip",
        verifiedAt: "2026-09-09",
        tag: "unknown",
      },
    ],
    ...overrides,
  };
}

function qualifiedPerson(
  personId: string,
  overrides: Partial<PrepSnapshotRecord> = {},
): PrepSnapshotRecord {
  return {
    id: `rec-${personId}`,
    personId,
    companyId: `co-${personId}`,
    attendanceConfidence: "confirmed",
    companyTier: "A",
    roleFit: "decision_maker",
    crmState: "not_present",
    prepStatus: "to_contact",
    evidenceIds: [`ev-${personId}`],
    currentEdition: true,
    cancelled: false,
    ...overrides,
  };
}

function makeQualifiedPeople(count: number): PrepSnapshotRecord[] {
  return Array.from({ length: count }, (_, index) =>
    qualifiedPerson(`person-${index + 1}`),
  );
}

const mixedPeopleFixture: PrepSnapshotRecord[] = [
  qualifiedPerson("only-qualifier"),
  qualifiedPerson("likely-attendee", { attendanceConfidence: "likely" }),
  qualifiedPerson("tier-b", { companyTier: "B" }),
  qualifiedPerson("only-qualifier", {
    id: "rec-only-qualifier-duplicate",
    roleFit: "influencer",
  }),
  qualifiedPerson("other-role", { roleFit: "other" }),
  qualifiedPerson("excluded", { companyTier: "excluded" }),
  {
    ...qualifiedPerson("unnamed"),
    personId: null,
  },
];

function makeSnapshot(records: PrepSnapshotRecord[], id = "snap-1"): PrepSnapshot {
  return {
    id,
    conferenceId: "test-conference",
    researchedAt: "2026-05-20T09:12:00.000Z",
    simulatedAt: null,
    records,
  };
}

describe("researched room scoring", () => {
  it("caps researched-room contribution at ten unique qualified people", () => {
    expect(roomEvidencePoints(makeQualifiedPeople(14))).toBe(10);
  });

  it("gives missing research zero provisional room points and marks it unknown", () => {
    expect(calculateConferenceScore(makeConference(), undefined)).toMatchObject({
      researchedRoomPoints: 0,
      researchedRoomStatus: "unknown",
      q: null,
    });
  });

  it("does not count likely, Tier B, duplicate, or non-decision roles in Q", () => {
    expect(calculateQualifiedRoomCount(mixedPeopleFixture)).toBe(1);
  });
});

describe("explainable conference score", () => {
  it("keeps audience size out of the score total", () => {
    const small = calculateConferenceScore(
      makeConference({ audienceSize: 100 }),
      undefined,
    );
    const large = calculateConferenceScore(
      makeConference({ audienceSize: 999999 }),
      undefined,
    );

    expect(small.total).toBe(large.total);
  });

  it("awards sourced buyer-role evidence separately from Q", () => {
    const score = calculateConferenceScore(
      makeConference(),
      makeSnapshot(makeQualifiedPeople(3)),
    );
    const buyer = score.components.find(
      (component) => component.component === "buyer_role_density",
    );

    expect(buyer?.points).toBe(18);
    expect(score.researchedRoomPoints).toBe(3);
    expect(score.q).toBe(3);
    expect(score.researchedRoomStatus).toBe("researched");
  });

  it("treats unknown component evidence as explicit unknown with zero provisional points", () => {
    const score = calculateConferenceScore(makeConference(), undefined);
    const trip = score.components.find(
      (component) => component.component === "trip_efficiency",
    );

    expect(trip).toMatchObject({ points: 0, status: "unknown", max: 10 });
    expect(score.total).toBe(80);
    expect(deriveTier(score.total)).toBe("A");
    expect(recommendDecision("A")).toBe("attend");
  });

  it("records a second snapshot score without overwriting the original", () => {
    const original = calculateConferenceScore(
      makeConference(),
      makeSnapshot(makeQualifiedPeople(3), "snap-1"),
    );
    const refreshed = calculateConferenceScore(
      makeConference(),
      makeSnapshot(makeQualifiedPeople(4), "snap-2"),
    );

    const stored = appendScoreSnapshot([], original);
    const next = appendScoreSnapshot(stored, refreshed);

    expect(next[0]).toEqual(original);
    expect(next[1]?.snapshotId).toBe("snap-2");
    expect(next).toHaveLength(2);
  });

  it("maps the approved tier thresholds", () => {
    expect(deriveTier(80)).toBe("A");
    expect(deriveTier(79)).toBe("B");
    expect(deriveTier(65)).toBe("B");
    expect(deriveTier(64)).toBe("C");
    expect(recommendDecision("B")).toBe("watch");
    expect(recommendDecision("C")).toBe("skip");
  });
});
