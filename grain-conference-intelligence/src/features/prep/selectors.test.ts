import { describe, expect, it } from "vitest";

import type { PrepSnapshotRecord } from "@/domain/types";
import {
  calculatePrepSummary,
  filterPrepRecords,
  sortPrepRecords,
  type PrepViewRecord,
} from "@/features/prep/selectors";

function record(overrides: Partial<PrepViewRecord> & { id: string }): PrepViewRecord {
  return {
    personId: overrides.personId ?? overrides.id,
    companyId: overrides.companyId ?? `co-${overrides.id}`,
    name: overrides.name ?? overrides.id,
    attendanceConfidence: "confirmed",
    companyTier: "A",
    roleFit: "decision_maker",
    crmState: "not_present",
    prepStatus: "to_contact",
    currentEdition: true,
    cancelled: false,
    hasUsableChannel: true,
    identityResolved: true,
    requiresCoordination: false,
    isNew: false,
    ...overrides,
  };
}

const mixedFixture: PrepViewRecord[] = [
  record({ id: "ready-confirmed" }),
  record({
    id: "ready-likely",
    attendanceConfidence: "likely",
    roleFit: "influencer",
  }),
  record({
    id: "coord-owner",
    crmState: "owned_by_other",
    requiresCoordination: true,
  }),
  record({ id: "coord-deal", crmState: "open_deal", requiresCoordination: true }),
  record({ id: "unknown-crm", crmState: "unknown" }),
  record({ id: "no-channel", hasUsableChannel: false }),
  record({ id: "unresolved-identity", identityResolved: false }),
  record({ id: "already-contacted", prepStatus: "contacted" }),
  record({ id: "unnamed", personId: null, name: "Company booth" }),
  record({
    id: "returner",
    attendanceConfidence: "probable_returner",
    currentEdition: false,
  }),
  record({ id: "tier-c", companyTier: "C" }),
  record({ id: "other-role", roleFit: "other" }),
  record({
    id: "b-confirmed",
    companyTier: "B",
    attendanceConfidence: "confirmed",
  }),
  record({
    id: "a-likely-extra",
    attendanceConfidence: "likely",
  }),
];

describe("prep summary counts", () => {
  it("counts verified, relevant, ready, and coordination subsets exactly", () => {
    expect(calculatePrepSummary(mixedFixture)).toEqual({
      attendeesVerified: 12,
      relevant: 10,
      readyToContact: 4,
      needCoordination: 2,
    });
  });

  it("keeps unknown CRM, missing channel, unresolved identity, and contacted records relevant but not actionable", () => {
    const summary = calculatePrepSummary(mixedFixture);
    expect(summary.readyToContact + summary.needCoordination).toBeLessThan(summary.relevant);

    const relevantIds = filterPrepRecords(mixedFixture, "relevant").map((item) => item.id);
    expect(relevantIds).toEqual(expect.arrayContaining([
      "unknown-crm",
      "no-channel",
      "unresolved-identity",
      "already-contacted",
    ]));
    expect(filterPrepRecords(mixedFixture, "ready").map((item) => item.id)).not.toEqual(
      expect.arrayContaining([
        "unknown-crm",
        "no-channel",
        "unresolved-identity",
        "already-contacted",
      ]),
    );
  });

  it("orders A+Confirmed, A+Likely, B+Confirmed, then remaining combinations", () => {
    expect(sortPrepRecords(mixedFixture).map((item) => item.id).slice(0, 6)).toEqual([
      "already-contacted",
      "coord-deal",
      "coord-owner",
      "no-channel",
      "other-role",
      "ready-confirmed",
    ]);
    const ordered = sortPrepRecords(mixedFixture);
    const aConfirmed = ordered.filter(
      (item) => item.companyTier === "A" && item.attendanceConfidence === "confirmed",
    );
    const aLikely = ordered.filter(
      (item) => item.companyTier === "A" && item.attendanceConfidence === "likely",
    );
    const bConfirmed = ordered.filter(
      (item) => item.companyTier === "B" && item.attendanceConfidence === "confirmed",
    );
    const firstALikely = ordered.findIndex((item) => item.id === aLikely[0]?.id);
    const firstBConfirmed = ordered.findIndex((item) => item.id === bConfirmed[0]?.id);
    expect(ordered.indexOf(aConfirmed[0])).toBeLessThan(firstALikely);
    expect(firstALikely).toBeLessThan(firstBConfirmed);
  });
});

describe("snapshot diff", () => {
  it("classifies added, changed, and cancelled evidence", async () => {
    const { diffSnapshots } = await import("@/features/prep/selectors");
    const previous: PrepSnapshotRecord[] = [
      {
        id: "keep",
        personId: "sam",
        companyId: "acme-payments",
        attendanceConfidence: "confirmed",
        companyTier: "A",
        roleFit: "decision_maker",
        crmState: "not_present",
        prepStatus: "to_contact",
        evidenceIds: ["sam-attendance-linkedin"],
        currentEdition: true,
        cancelled: false,
      },
      {
        id: "changed",
        personId: "edge-changed",
        companyId: "fictional-changed-co",
        attendanceConfidence: "likely",
        companyTier: "B",
        roleFit: "influencer",
        crmState: "not_present",
        prepStatus: "to_contact",
        evidenceIds: ["edge-changed-likely"],
        currentEdition: true,
        cancelled: false,
      },
      {
        id: "removed",
        personId: "edge-cancelled",
        companyId: "fictional-cancelled-co",
        attendanceConfidence: "confirmed",
        companyTier: "B",
        roleFit: "other",
        crmState: "unknown",
        prepStatus: "to_contact",
        evidenceIds: ["edge-cancelled-listed"],
        currentEdition: true,
        cancelled: false,
      },
    ];
    const current: PrepSnapshotRecord[] = [
      previous[0],
      {
        ...previous[1],
        attendanceConfidence: "confirmed",
        evidenceIds: ["edge-changed-likely", "edge-changed-confirmed"],
      },
      {
        ...previous[2],
        attendanceConfidence: "unknown",
        cancelled: true,
        currentEdition: false,
        evidenceIds: ["edge-cancelled-listed", "edge-cancelled-removed"],
      },
      {
        id: "added",
        personId: null,
        companyId: "meridian-remit",
        attendanceConfidence: "likely",
        companyTier: "A",
        roleFit: "unknown",
        crmState: "not_present",
        prepStatus: "to_contact",
        evidenceIds: ["edge-company-only-evidence"],
        currentEdition: true,
        cancelled: false,
      },
    ];

    expect(diffSnapshots(previous, current)).toEqual({
      added: ["added"],
      changed: ["changed"],
      removedOrCancelled: ["removed"],
    });
  });
});
