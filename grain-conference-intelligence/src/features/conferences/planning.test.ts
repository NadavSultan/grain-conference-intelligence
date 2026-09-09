import { describe, expect, it } from "vitest";

import type { ConferenceRecord } from "@/domain/types";
import {
  deriveConflicts,
  deriveTripClusters,
  deriveUncoveredQuarters,
  selectFocusItems,
} from "@/features/conferences/planning";

function conference(
  id: string,
  location: string,
  startDate: string,
  endDate = startDate,
): ConferenceRecord {
  return {
    id,
    name: id,
    edition: "2026",
    startDate,
    endDate,
    location,
    geography: "Europe",
    vertical: "fintech",
    sourceUrl: "https://example.test/event",
    verifiedAt: "2026-09-09",
    audienceSize: null,
    audienceSizeSource: null,
    scoreEvidence: [],
  };
}

describe("coverage planning", () => {
  it("creates a conflict when the same owner has overlapping dates", () => {
    expect(
      deriveConflicts([
        {
          conferenceId: "money20-middle-east-2026",
          owner: "Alex",
          startDate: "2026-09-14",
          endDate: "2026-09-16",
        },
        {
          conferenceId: "eurofinance-2026",
          owner: "Alex",
          startDate: "2026-09-16",
          endDate: "2026-09-18",
        },
      ]),
    ).toEqual([
      {
        owner: "Alex",
        conferenceIds: ["eurofinance-2026", "money20-middle-east-2026"],
      },
    ]);
  });

  it("does not create a conflict for overlapping dates with different owners", () => {
    expect(
      deriveConflicts([
        {
          conferenceId: "money20-middle-east-2026",
          owner: "Alex",
          startDate: "2026-09-14",
          endDate: "2026-09-16",
        },
        {
          conferenceId: "eurofinance-2026",
          owner: "Sam",
          startDate: "2026-09-16",
          endDate: "2026-09-18",
        },
      ]),
    ).toEqual([]);
  });

  it("creates one trip cluster for same-city events within seven days", () => {
    const clusters = deriveTripClusters([
      conference(
        "business-travel-show-europe-2027",
        "ExCeL London, London, United Kingdom",
        "2027-06-23",
        "2027-06-24",
      ),
      conference(
        "traveltech-show-2027",
        "ExCeL London, London, United Kingdom",
        "2027-06-23",
        "2027-06-24",
      ),
    ]);

    expect(clusters).toEqual([
      {
        city: "London",
        conferenceIds: [
          "business-travel-show-europe-2027",
          "traveltech-show-2027",
        ],
      },
    ]);
  });

  it("marks a quarter with no attend decision as uncovered", () => {
    expect(
      deriveUncoveredQuarters(
        [
          {
            conferenceId: "money20-usa-2026",
            decision: "attend",
            startDate: "2026-10-18",
          },
        ],
        ["2026"],
      ),
    ).toEqual(["2026-Q1", "2026-Q2", "2026-Q3"]);
  });
});

describe("today's focus", () => {
  it("lists undecided upcoming conferences and direct Prep links", () => {
    const items = selectFocusItems({
      asOf: "2026-05-20",
      conferences: [
        conference("past-event", "Amsterdam, Netherlands", "2026-04-01", "2026-04-03"),
        conference("undecided-future", "Amsterdam, Netherlands", "2026-10-18", "2026-10-21"),
        conference("already-decided", "Barcelona, Spain", "2026-09-16", "2026-09-18"),
        conference("money20-europe-2027", "The RAI, Amsterdam, Netherlands", "2027-06-08", "2027-06-10"),
      ],
      plans: {
        "already-decided": { decision: "attend", owner: "Alex" },
        "undecided-future": { decision: "undecided", owner: null },
        "money20-europe-2027": { decision: "undecided", owner: null },
      },
      prepConferenceIds: ["money20-europe-2027", "eurofinance-2026"],
    });

    expect(items).toEqual([
      {
        kind: "undecided_conference",
        conferenceId: "undecided-future",
        href: "/conferences/undecided-future",
      },
      {
        kind: "undecided_conference",
        conferenceId: "money20-europe-2027",
        href: "/conferences/money20-europe-2027",
      },
      {
        kind: "prep_link",
        conferenceId: "money20-europe-2027",
        href: "/conferences/money20-europe-2027?tab=prep",
      },
    ]);
  });
});
