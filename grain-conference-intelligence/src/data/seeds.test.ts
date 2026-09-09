import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { CONFERENCES, audienceSizeLabel } from "@/data/conferences";
import {
  ALL_EVIDENCE,
  EDGE_FIXTURES,
  FULL_PROFILE_IDS,
  PREP_SNAPSHOTS,
  PROFILE_CLAIMS,
  PROFILES,
  type FullProfileId,
} from "@/data/prep-snapshots";
import { createDemoWorkspace } from "@/data/demo-workspace";
import { workspaceStateV1Schema } from "@/domain/schemas";
import type { EvidenceRecord, ProfileClaimReference, TimelineEntry } from "@/domain/types";

function exhibitAnchorText(evidence: EvidenceRecord): string {
  const url = new URL(evidence.exhibitUrl, "https://local.test");
  const exhibit = readFileSync(join(process.cwd(), "public", url.pathname), "utf8");
  const parsed = document.implementation.createHTMLDocument();
  parsed.documentElement.innerHTML = exhibit;
  const anchor = parsed.getElementById(url.hash.slice(1));
  expect(anchor, evidence.exhibitUrl).not.toBeNull();
  return anchor?.textContent ?? "";
}

function claimSupportCorpus(
  claim: ProfileClaimReference,
  evidenceById: Map<string, EvidenceRecord>,
  timelineById: Map<string, TimelineEntry>,
): string {
  const evidenceText = claim.evidenceIds.flatMap((id) => {
    const evidence = evidenceById.get(id);
    expect(evidence, id).toBeDefined();
    return [evidence?.claim, evidence?.quote, exhibitAnchorText(evidence!)];
  });
  const timelineText = claim.timelineIds.map((id) => {
    const entry = timelineById.get(id);
    expect(entry, id).toBeDefined();
    return entry?.summary;
  });
  return [...evidenceText, ...timelineText].filter(Boolean).join("\n");
}

function factualDisplayPaths(personId: FullProfileId): string[] {
  const profile = PROFILES[personId];
  return [
    "identity.name", "identity.title", "identity.company", "headline",
    "contact.linkedIn", profile.contact.email ? "contact.email" : "contact.emailGap",
    ...profile.attendanceEvidence.map((_, index) => `attendanceEvidence.${index}`),
    ...profile.whyThisPersonMatters.map((_, index) => `whyThisPersonMatters.${index}`),
    ...profile.relationshipHistory.map((_, index) => `relationshipHistory.${index}`),
    ...profile.recentSignals.map((_, index) => `recentSignals.${index}`),
    "suggestedAngle",
    ...(profile.coordinationStep ? ["coordinationStep"] : []),
    ...(profile.relationshipRead.text ? ["relationshipRead.text"] : []),
    ...profile.relationshipRead.counterEvidence.map((_, index) => `relationshipRead.counterEvidence.${index}`),
    ...(profile.drafts.email ? ["drafts.email.body"] : []),
    ...(profile.drafts.linkedIn ? ["drafts.linkedIn.body"] : []),
    "nextAction",
  ].sort();
}

describe("conference source ledger", () => {
  it("matches the hand-verified organizer ledger for schedule, venue, and audience", () => {
    const expected = {
      "money20-europe-2027": ["2027-06-08", "2027-06-10", "The RAI, Amsterdam, Netherlands", 7400, "https://europe.money2020.com/attend"],
      "money20-usa-2026": ["2026-10-18", "2026-10-21", "The Venetian, Las Vegas, Nevada, USA", 11000, "https://us.money2020.com/attend/faq"],
      "money20-middle-east-2026": ["2026-09-14", "2026-09-16", "Riyadh Exhibition & Convention Center, Malham, Saudi Arabia", 38000, "https://money2020middleeast.com/about-us/key-information"],
      "money20-asia-2027": ["2027-04-27", "2027-04-29", "Queen Sirikit National Convention Center, Bangkok, Thailand", 5000, "https://asia.money2020.com/attend"],
      "singapore-fintech-festival-2026": ["2026-11-18", "2026-11-20", "Singapore EXPO, Singapore", null, "https://www.fintechfestival.sg/"],
      "sibos-2026": ["2026-09-28", "2026-10-01", "Miami Beach Convention Center, Miami Beach, Florida, USA", null, "https://www.sibos.com/attend/faq"],
      "eurofinance-2026": ["2026-09-16", "2026-09-18", "Barcelona International Convention Centre, Barcelona, Spain", null, "https://www.eurofinance.com/international-treasury-event/faq/"],
      "seamless-middle-east-2026": ["2026-09-22", "2026-09-24", "Dubai World Trade Centre, Dubai, United Arab Emirates", 20000, "https://www.terrapinn.com/exhibition/seamless-middle-east-fintech/"],
      "itb-berlin-2027": ["2027-03-16", "2027-03-18", "Berlin Exhibition Grounds, Berlin, Germany", null, "https://www.itb.com/en"],
      "saastr-ai-annual-2027": ["2027-05-11", "2027-05-12", "San Francisco Bay Area, USA", 10000, "https://www.saastrannual.com/"],
      "business-travel-show-europe-2027": ["2027-06-23", "2027-06-24", "ExCeL London, London, United Kingdom", null, "https://www.businesstravelshoweurope.com/hosted/hosted-buyer-faqs"],
      "traveltech-show-2027": ["2027-06-23", "2027-06-24", "ExCeL London, London, United Kingdom", null, "https://traveltech-show.com/"],
    } as const;

    expect(Object.fromEntries(CONFERENCES.map((conference) => [conference.id, [conference.startDate, conference.endDate, conference.location, conference.audienceSize, conference.sourceUrl]]))).toEqual(expected);
  });

  it("binds each score component to its hand-checked supporting organizer page", () => {
    const expectedSources: Record<string, Record<string, string>> = {
      "money20-europe-2027": { vertical_fit: "https://europe.money2020.com/attend", buyer_role_density: "https://europe.money2020.com/attend", fx_relevance: "https://europe.money2020.com/", meeting_accessibility: "https://europe.money2020.com/attend", trip_efficiency: "https://europe.money2020.com/attend" },
      "money20-usa-2026": { vertical_fit: "https://us.money2020.com/", buyer_role_density: "https://us.money2020.com/", fx_relevance: "https://us.money2020.com/", meeting_accessibility: "https://us.money2020.com/platinum-pass", trip_efficiency: "https://us.money2020.com/attend/faq" },
      "money20-middle-east-2026": { vertical_fit: "https://money2020middleeast.com/about-us/key-information", buyer_role_density: "https://money2020middleeast.com/tickets-2026", fx_relevance: "https://app.money2020middleeast.com/event/money20-20-middle-east-2026/planning/UGxhbm5pbmdfNDU2MTk5Mg%3D%3D", meeting_accessibility: "https://money2020middleeast.com/tickets-2026", trip_efficiency: "https://money2020middleeast.com/about-us/key-information" },
      "money20-asia-2027": { vertical_fit: "https://asia.money2020.com/attend", buyer_role_density: "https://asia.money2020.com/attend", fx_relevance: "https://asia.money2020.com/attend", meeting_accessibility: "https://asia.money2020.com/attend", trip_efficiency: "https://asia.money2020.com/attend" },
      "singapore-fintech-festival-2026": { vertical_fit: "https://www.fintechfestival.sg/", buyer_role_density: "https://www.fintechfestival.sg/join-sff2026", fx_relevance: "https://www.fintechfestival.sg/agenda?session=AGND577-one-world-many-rails-defining-the-next-chapter-of-money-movement", meeting_accessibility: "https://www.fintechfestival.sg/join-sff2026", trip_efficiency: "https://www.fintechfestival.sg/" },
      "sibos-2026": { vertical_fit: "https://www.sibos.com/", buyer_role_density: "https://www.sibos.com/programme/conference-at-glance", fx_relevance: "https://www.sibos.com/programme/conference", meeting_accessibility: "https://www.sibos.com/", trip_efficiency: "https://www.sibos.com/attend/faq" },
      "eurofinance-2026": { vertical_fit: "https://www.eurofinance.com/international-treasury-event/registration/", buyer_role_density: "https://www.eurofinance.com/international-treasury-event/faq/", fx_relevance: "https://www.eurofinance.com/international-treasury-event/treasury-exchange-roundtables/", meeting_accessibility: "https://www.eurofinance.com/international-treasury-event/networking-app/", trip_efficiency: "https://www.eurofinance.com/international-treasury-event/faq/" },
      "seamless-middle-east-2026": { vertical_fit: "https://www.terrapinn.com/exhibition/seamless-middle-east-fintech/", buyer_role_density: "https://www.terrapinn.com/exhibition/seamless-middle-east-fintech/Event-Highlights.stm", fx_relevance: "https://www.terrapinn.com/exhibition/seamless-middle-east-fintech/Agenda.stm", meeting_accessibility: "https://www.terrapinn.com/exhibition/seamless-middle-east-fintech/frequently-asked-questions.stm", trip_efficiency: "https://www.terrapinn.com/exhibition/seamless-middle-east-fintech/" },
      "itb-berlin-2027": { vertical_fit: "https://www.itb.com/en", buyer_role_density: "https://www.itb.com/en/ausstellen/exhibition-areas/travel-technology", fx_relevance: "https://www.itb.com/en/ausstellen/exhibition-areas/travel-technology", meeting_accessibility: "https://www.itb.com/en/itb-berlin-for-visitors/exhibiton-planning/itb-navigator", trip_efficiency: "https://www.itb.com/en" },
      "saastr-ai-annual-2027": { vertical_fit: "https://www.saastrannual.com/", buyer_role_density: "https://www.saastrannual.com/", fx_relevance: "https://www.saastrannual.com/", meeting_accessibility: "https://www.saastrannual.com/", trip_efficiency: "https://www.saastrannual.com/" },
      "business-travel-show-europe-2027": { vertical_fit: "https://www.businesstravelshoweurope.com/", buyer_role_density: "https://www.businesstravelshoweurope.com/hosted/hosted-buyer-faqs", fx_relevance: "https://www.businesstravelshoweurope.com/", meeting_accessibility: "https://www.businesstravelshoweurope.com/hosted/hosted-buyer-faqs", trip_efficiency: "https://traveltech-show.com/visit/co-located-shows" },
      "traveltech-show-2027": { vertical_fit: "https://traveltech-show.com/", buyer_role_density: "https://traveltech-show.com/exhibit", fx_relevance: "https://traveltech-show.com/about-us/our-story", meeting_accessibility: "https://traveltech-show.com/exhibit", trip_efficiency: "https://traveltech-show.com/exhibit" },
    };

    expect(Object.fromEntries(CONFERENCES.map((conference) => [conference.id, Object.fromEntries(conference.scoreEvidence.map((item) => [item.component, item.sourceUrl]))]))).toEqual(expectedSources);
  });

  it("stores SaaStr's 10,000 audience from the official 2027 organizer page", () => {
    const saastr = CONFERENCES.find((conference) => conference.id === "saastr-ai-annual-2027");
    expect(saastr?.audienceSize).toBe(10000);
    expect(saastr?.audienceSizeSource).toBe("https://www.saastrannual.com/");
    expect(saastr?.sourceUrl).toBe("https://www.saastrannual.com/");
    expect(saastr?.scoreEvidence.find((item) => item.component === "buyer_role_density")).toMatchObject({
      claim: expect.stringContaining("10,000"),
      sourceUrl: "https://www.saastrannual.com/",
      tag: "verified",
    });
  });

  it("points the Money20/20 Middle East 38,000 buyer-density claim at the 2026 ticket page", () => {
    const middleEast = CONFERENCES.find((conference) => conference.id === "money20-middle-east-2026");
    expect(middleEast?.audienceSize).toBe(38000);
    expect(middleEast?.audienceSizeSource).toBe("https://money2020middleeast.com/tickets-2026");
    expect(middleEast?.scoreEvidence.find((item) => item.component === "buyer_role_density")).toMatchObject({
      claim: expect.stringContaining("38,000"),
      sourceUrl: "https://money2020middleeast.com/tickets-2026",
    });
  });
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

  it("references every displayed profile claim with correctly owned evidence or timeline IDs", () => {
    const workspace = createDemoWorkspace();
    const evidenceById = new Map(ALL_EVIDENCE.map((item) => [item.id, item]));
    const timelineById = new Map(workspace.timeline.map((item) => [item.id, item]));
    const expectedCompanyIds = {
      sam: "acme-payments",
      david: "northwind-travel",
      priya: "lumio-marketplace",
      marcus: "payloom",
    } as const;

    for (const personId of FULL_PROFILE_IDS) {
      const inventory = PROFILE_CLAIMS[personId];
      expect(inventory.companyId).toBe(expectedCompanyIds[personId]);
      expect(inventory.claims.map((claim) => claim.displayPath).sort()).toEqual(factualDisplayPaths(personId));
      expect(inventory.claims.some((claim) => claim.displayPath === "prepStatus")).toBe(false);
      for (const claim of inventory.claims) {
        expect(claim.evidenceIds.length + claim.timelineIds.length, `${personId}:${claim.displayPath}`).toBeGreaterThan(0);
        for (const evidenceId of claim.evidenceIds) {
          const evidence = evidenceById.get(evidenceId);
          expect(evidence, `${personId}:${claim.displayPath}:${evidenceId}`).toBeDefined();
          expect(evidence?.personId).toBe(personId);
          expect(evidence?.companyId).toBe(inventory.companyId);
        }
        for (const timelineId of claim.timelineIds) {
          const timeline = timelineById.get(timelineId);
          expect(timeline, `${personId}:${claim.displayPath}:${timelineId}`).toBeDefined();
          expect(timeline?.personId).toBe(personId);
          expect(timeline?.companyId).toBe(inventory.companyId);
        }
      }
    }
  });

  it("fails if every profile evidence record is bulk-assigned to every claim", () => {
    for (const personId of FULL_PROFILE_IDS) {
      const allEvidenceIds = [...PROFILES[personId].evidence.map((item) => item.id)].sort();
      const signatures = PROFILE_CLAIMS[personId].claims.map((claim) =>
        `${[...claim.evidenceIds].sort().join(",")}|${[...claim.timelineIds].sort().join(",")}`,
      );

      expect(allEvidenceIds.length).toBeGreaterThan(1);
      expect(new Set(signatures).size, personId).toBeGreaterThan(1);
      for (const claim of PROFILE_CLAIMS[personId].claims) {
        expect([...claim.evidenceIds].sort(), `${personId}:${claim.displayPath}`).not.toEqual(allEvidenceIds);
      }
      expect(
        PROFILE_CLAIMS[personId].claims.every(
          (claim) => [...claim.evidenceIds].sort().join(",") === allEvidenceIds.join(","),
        ),
        personId,
      ).toBe(false);
    }
  });

  it("keeps prepStatus as user-facing profile content without attributing it to public or CRM evidence", () => {
    expect(PROFILES.sam.prepStatus).toBe("To contact");
    expect(PROFILES.david.prepStatus).toBe("Needs coordination");
    expect(PROFILES.priya.prepStatus).toBe("To contact");
    expect(PROFILES.marcus.prepStatus).toBe("To contact");
    for (const personId of FULL_PROFILE_IDS) {
      expect(PROFILE_CLAIMS[personId].claims.map((claim) => claim.displayPath)).not.toContain("prepStatus");
    }
  });

  it("cites exact identity and contact values, or an explicit email Unknown gap", () => {
    const workspace = createDemoWorkspace();
    const evidenceById = new Map(ALL_EVIDENCE.map((item) => [item.id, item]));
    const timelineById = new Map(workspace.timeline.map((item) => [item.id, item]));

    for (const personId of FULL_PROFILE_IDS) {
      const profile = PROFILES[personId];
      const claims = Object.fromEntries(PROFILE_CLAIMS[personId].claims.map((claim) => [claim.displayPath, claim]));
      const nameCorpus = claimSupportCorpus(claims["identity.name"], evidenceById, timelineById);
      const titleCorpus = claimSupportCorpus(claims["identity.title"], evidenceById, timelineById);
      const companyCorpus = claimSupportCorpus(claims["identity.company"], evidenceById, timelineById);
      const linkedInCorpus = claimSupportCorpus(claims["contact.linkedIn"], evidenceById, timelineById);

      expect(nameCorpus, `${personId} name`).toContain(profile.name);
      expect(titleCorpus, `${personId} title`).toContain(profile.title);
      expect(companyCorpus, `${personId} company`).toContain(profile.company);
      expect(linkedInCorpus, `${personId} linkedin`).toContain(profile.contact.linkedIn.value);

      if (profile.contact.email) {
        const emailClaim = claims["contact.email"];
        const emailCorpus = claimSupportCorpus(emailClaim, evidenceById, timelineById);
        expect(emailCorpus, `${personId} email`).toContain(profile.contact.email.value);
        if (profile.contact.email.confidence === "inferred") {
          expect(emailCorpus, `${personId} inferred email`).toMatch(/inferred/i);
        } else {
          expect(emailCorpus, `${personId} verified email`).toMatch(/verified/i);
        }
      } else {
        const gapClaim = claims["contact.emailGap"];
        const gapCorpus = claimSupportCorpus(gapClaim, evidenceById, timelineById);
        expect(gapClaim.evidenceIds, `${personId} email gap must not use CRM absence`).not.toContain("priya-crm-gap");
        expect(gapCorpus, `${personId} email gap`).toMatch(/email/i);
        expect(gapCorpus, `${personId} email unknown`).toMatch(/unknown|not available/i);
        expect(gapCorpus, `${personId} email gap is not a CRM relationship claim`).not.toMatch(/no prior relationship/i);
      }
    }
  });

  it("supports every factual headline component with labelled attendance, tier, and CRM provenance", () => {
    const workspace = createDemoWorkspace();
    const evidenceById = new Map(ALL_EVIDENCE.map((item) => [item.id, item]));
    const timelineById = new Map(workspace.timeline.map((item) => [item.id, item]));
    const headlineComponents: Record<FullProfileId, string[]> = {
      sam: ["Confirmed attending", "Tier A", "Not in HubSpot"],
      david: ["Confirmed attending", "speaker", "Tier A", "In HubSpot", "owned by another rep", "last activity 14 months ago"],
      priya: ["Likely attending", "Tier B", "Not in HubSpot"],
      marcus: ["Confirmed attending", "speaker", "Tier A", "In HubSpot", "owned by me"],
    };
    const tierPremises: Record<FullProfileId, string[]> = {
      sam: ["Acme Payments", "14 currencies", "Head of Treasury"],
      david: ["Northwind Travel Group", "THB", "CFO"],
      priya: ["Lumio Marketplace", "Unknown", "influencer"],
      marcus: ["Payloom", "28 currencies", "Treasury Director"],
    };

    for (const personId of FULL_PROFILE_IDS) {
      const claim = PROFILE_CLAIMS[personId].claims.find((item) => item.displayPath === "headline");
      expect(claim, personId).toBeDefined();
      const corpus = claimSupportCorpus(claim!, evidenceById, timelineById);
      for (const component of headlineComponents[personId]) {
        expect(corpus, `${personId} headline:${component}`).toContain(component);
      }
      for (const premise of tierPremises[personId]) {
        expect(corpus, `${personId} tier premise:${premise}`).toContain(premise);
      }
      expect(corpus, `${personId} tier classification label`).toMatch(/classif|infer/i);
    }
  });

  it("requires referenced evidence and exhibits to contain the distinctive facts of each displayed claim", () => {
    const workspace = createDemoWorkspace();
    const evidenceById = new Map(ALL_EVIDENCE.map((item) => [item.id, item]));
    const timelineById = new Map(workspace.timeline.map((item) => [item.id, item]));
    const requiredNeedles: Record<FullProfileId, Record<string, string[]>> = {
      sam: {
        "attendanceEvidence.0": ["swap notes on multi-currency settlement"],
        "whyThisPersonMatters.0": ["January 2025", "Treasury Manager"],
        "whyThisPersonMatters.1": ["cash forecasting", "payment-rail"],
        "whyThisPersonMatters.2": ["decision maker", "Inferred"],
        "whyThisPersonMatters.3": ["280", "Berlin", "Lisbon", "Acme Payments"],
        "whyThisPersonMatters.4": ["14 currencies", "PLN", "MXN", "BRL"],
        "whyThisPersonMatters.5": ["FX & Liquidity Analyst"],
        "whyThisPersonMatters.6": ["Unknown"],
        "whyThisPersonMatters.7": ["Unknown"],
        "relationshipHistory.0": ["No HubSpot"],
        "recentSignals.0": ["Heading to Money20/20"],
        "recentSignals.1": ["six new settlement currencies"],
        "recentSignals.2": ["FX & Liquidity Analyst"],
        suggestedAngle: ["swap notes on multi-currency settlement", "inferred"],
        "drafts.email.body": ["swap notes on multi-currency settlement", "six new settlement currencies"],
        "drafts.linkedIn.body": ["MXN", "BRL"],
        nextAction: ["Inferred"],
      },
      david: {
        "attendanceEvidence.0": ["Treasury in travel: managing volatility when you pay in one currency and sell in another", "Thursday 14:00"],
        "attendanceEvidence.1": ["Speaking on the treasury panel at Money20/20 Thursday 2pm"],
        "whyThisPersonMatters.0": ["2022", "Finance Director"],
        "whyThisPersonMatters.1": ["decision maker", "inference"],
        "whyThisPersonMatters.2": ["600", "EUR", "THB", "GBP"],
        "whyThisPersonMatters.3": ["1.8 percentage points"],
        "whyThisPersonMatters.4": ["forward contracts", "Inferred"],
        "whyThisPersonMatters.5": ["Unknown"],
        "relationshipHistory.0": ["20 months", "webinar"],
        "relationshipHistory.1": ["14 months"],
        "relationshipHistory.2": ["not a priority this year"],
        "relationshipHistory.3": ["No open deal"],
        "recentSignals.0": ["Thursday 2pm"],
        "recentSignals.1": ["1.8"],
        "recentSignals.2": ["THB"],
        suggestedAngle: ["wasn't a priority", "THB"],
        coordinationStep: ["owned by", "treasury panel"],
        "relationshipRead.text": ["Owned by another rep"],
        "relationshipRead.counterEvidence.0": ["No reply"],
        "relationshipRead.counterEvidence.1": ["No open deal"],
        "drafts.email.body": ["forward", "THB"],
        nextAction: ["Coordinate"],
      },
      priya: {
        "attendanceEvidence.0": ["Fintech Founders Dinner"],
        "attendanceEvidence.1": ["speaker", "sponsor"],
        "whyThisPersonMatters.0": ["18 months", "gig-economy"],
        "whyThisPersonMatters.1": ["influencer", "Inferred"],
        "whyThisPersonMatters.2": ["30 countries", "900", "Dublin"],
        "whyThisPersonMatters.3": ["Brazil", "Mexico"],
        "whyThisPersonMatters.4": ["Unknown"],
        "whyThisPersonMatters.5": ["Unknown"],
        "whyThisPersonMatters.6": ["Unknown"],
        "relationshipHistory.0": ["None"],
        "recentSignals.0": ["Fintech Founders Dinner"],
        "recentSignals.1": ["BRL", "MXN"],
        "recentSignals.2": ["Series C", "LATAM"],
        suggestedAngle: ["BRL", "MXN", "Unknown"],
        "relationshipRead.counterEvidence.0": ["Likely"],
        "relationshipRead.counterEvidence.1": ["Unknown"],
        "drafts.linkedIn.body": ["Founders Dinner", "BRL", "MXN"],
        nextAction: ["Unknown"],
      },
      marcus: {
        "attendanceEvidence.0": ["Building payouts into 40 markets", "Wednesday 11:30"],
        "attendanceEvidence.1": ["last year's"],
        "whyThisPersonMatters.0": ["2023"],
        "whyThisPersonMatters.1": ["decision maker"],
        "whyThisPersonMatters.2": ["40 payout markets", "28 currencies", "350", "Amsterdam"],
        "whyThisPersonMatters.3": ["12 new corridors", "Africa", "LATAM"],
        "whyThisPersonMatters.4": ["the big pairs with our bank, the rest we eat"],
        "whyThisPersonMatters.5": ["unnamed bank", "Cited"],
        "relationshipHistory.0": ["revisit Q1"],
        "relationshipHistory.1": ["one-pager", "new year"],
        "relationshipHistory.2": ["No reply"],
        "relationshipHistory.3": ["emerging-market corridors"],
        "relationshipHistory.4": ["No open deal", "Lead"],
        "relationshipHistory.5": ["Planned second encounter", "2nd encounter"],
        "recentSignals.0": ["Building payouts into 40 markets"],
        "recentSignals.1": ["12 new corridors"],
        "recentSignals.2": ["Treasury Analyst, emerging markets FX"],
        suggestedAngle: ["12", "infer"],
        "relationshipRead.text": ["unclear"],
        "relationshipRead.counterEvidence.0": ["No reply", "eight months"],
        "relationshipRead.counterEvidence.1": ["like"],
        "relationshipRead.counterEvidence.2": ["one actual"],
        "drafts.email.body": ["12 new corridors", "fireside"],
        "drafts.linkedIn.body": ["12 new corridors"],
        nextAction: ["replied"],
      },
    };

    for (const personId of FULL_PROFILE_IDS) {
      const claims = Object.fromEntries(PROFILE_CLAIMS[personId].claims.map((claim) => [claim.displayPath, claim]));
      for (const [displayPath, needles] of Object.entries(requiredNeedles[personId])) {
        const claim = claims[displayPath];
        expect(claim, `${personId}:${displayPath}`).toBeDefined();
        const corpus = claimSupportCorpus(claim, evidenceById, timelineById);
        for (const needle of needles) {
          expect(corpus, `${personId}:${displayPath}:${needle}`).toContain(needle);
        }
      }
    }
  });

  it("labels every local exhibit and supplies dated fixture content", () => {
    for (const filename of ["sam.html", "david.html", "priya.html", "marcus.html", "edge-fixtures.html"]) {
      const exhibit = readFileSync(join(process.cwd(), "public", "evidence", filename), "utf8");
      expect(exhibit).toContain("Fictional demo evidence — not a live public source");
      expect(exhibit).toMatch(/Dated|Recorded|researched on/i);
    }
  });

  it("resolves every local evidence URL to a real HTML anchor", () => {
    for (const evidence of ALL_EVIDENCE) {
      const url = new URL(evidence.exhibitUrl, "https://local.test");
      const exhibit = readFileSync(join(process.cwd(), "public", url.pathname), "utf8");
      const parsed = document.implementation.createHTMLDocument();
      parsed.documentElement.innerHTML = exhibit;
      expect(parsed.getElementById(url.hash.slice(1)), evidence.exhibitUrl).not.toBeNull();
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

  it("keeps Sam, David, Priya, and Marcus unchanged between Money20/20 snapshots", () => {
    const [first, second] = PREP_SNAPSHOTS.filter((snapshot) => snapshot.conferenceId === "money20-eu-demo");
    const firstById = new Map(first.records.map((record) => [record.id, record]));
    const secondById = new Map(second.records.map((record) => [record.id, record]));

    for (const recordId of ["money-sam", "money-david", "money-priya", "money-marcus"]) {
      expect(secondById.get(recordId), recordId).toEqual(firstById.get(recordId));
    }
  });

  it("models one added, one changed, and one cancelled Money20/20 transition with compact edge fixtures", () => {
    const [first, second] = PREP_SNAPSHOTS.filter((snapshot) => snapshot.conferenceId === "money20-eu-demo");
    const firstById = new Map(first.records.map((record) => [record.id, record]));
    const secondById = new Map(second.records.map((record) => [record.id, record]));

    expect(second.records.filter((record) => !firstById.has(record.id)).map((record) => record.id)).toEqual(["money-company-only"]);
    expect(firstById.get("money-edge-changed")).toMatchObject({
      id: "money-edge-changed",
      personId: "edge-changed",
      attendanceConfidence: "likely",
      cancelled: false,
    });
    expect(secondById.get("money-edge-changed")).toMatchObject({
      id: "money-edge-changed",
      personId: "edge-changed",
      attendanceConfidence: "confirmed",
      cancelled: false,
    });
    expect(secondById.get("money-edge-changed")?.evidenceIds).toEqual(
      expect.arrayContaining(["edge-changed-likely", "edge-changed-confirmed"]),
    );
    expect(firstById.get("money-edge-cancelled")).toMatchObject({
      id: "money-edge-cancelled",
      personId: "edge-cancelled",
      cancelled: false,
    });
    expect(secondById.get("money-edge-cancelled")).toMatchObject({
      id: "money-edge-cancelled",
      personId: "edge-cancelled",
      cancelled: true,
      attendanceConfidence: "unknown",
    });
    expect(secondById.get("money-edge-cancelled")?.evidenceIds).toEqual(
      expect.arrayContaining(["edge-cancelled-listed", "edge-cancelled-removed"]),
    );
    expect(EDGE_FIXTURES.changedAttendance.id).toBe("edge-changed");
    expect(EDGE_FIXTURES.cancelledSpeaker.personId).toBe("edge-cancelled");
    expect(EDGE_FIXTURES.companyOnly.personId).toBeNull();
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
    expect(EDGE_FIXTURES.changedAttendance.attendanceFrom).toBe("likely");
    expect(EDGE_FIXTURES.changedAttendance.attendanceTo).toBe("confirmed");
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
