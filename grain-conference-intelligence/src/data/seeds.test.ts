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
} from "@/data/prep-snapshots";
import { createDemoWorkspace } from "@/data/demo-workspace";
import { workspaceStateV1Schema } from "@/domain/schemas";

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
    const expectedSupport = {
      sam: {
        "identity.name": { evidenceIds: ["sam-role-linkedin"], timelineIds: [] },
        "identity.title": { evidenceIds: ["sam-role-linkedin"], timelineIds: [] },
        "identity.company": { evidenceIds: ["sam-company-facts"], timelineIds: [] },
        headline: { evidenceIds: ["sam-attendance-linkedin", "sam-crm-gap"], timelineIds: [] },
        prepStatus: { evidenceIds: ["sam-crm-gap"], timelineIds: [] },
        "contact.linkedIn": { evidenceIds: ["sam-attendance-linkedin"], timelineIds: [] },
        "contact.email": { evidenceIds: ["sam-email-pattern"], timelineIds: [] },
        "attendanceEvidence.0": { evidenceIds: ["sam-attendance-linkedin"], timelineIds: [] },
        "whyThisPersonMatters.0": { evidenceIds: ["sam-role-linkedin"], timelineIds: [] },
        "whyThisPersonMatters.1": { evidenceIds: ["sam-posting-pattern"], timelineIds: [] },
        "whyThisPersonMatters.2": { evidenceIds: ["sam-role-linkedin"], timelineIds: [] },
        "whyThisPersonMatters.3": { evidenceIds: ["sam-company-facts"], timelineIds: [] },
        "whyThisPersonMatters.4": { evidenceIds: ["sam-currency-expansion"], timelineIds: [] },
        "whyThisPersonMatters.5": { evidenceIds: ["sam-fx-job"], timelineIds: [] },
        "whyThisPersonMatters.6": { evidenceIds: ["sam-provider-unknown"], timelineIds: [] },
        "whyThisPersonMatters.7": { evidenceIds: ["sam-provider-unknown"], timelineIds: [] },
        "relationshipHistory.0": { evidenceIds: ["sam-crm-gap"], timelineIds: [] },
        "recentSignals.0": { evidenceIds: ["sam-attendance-linkedin"], timelineIds: [] },
        "recentSignals.1": { evidenceIds: ["sam-currency-expansion"], timelineIds: [] },
        "recentSignals.2": { evidenceIds: ["sam-fx-job"], timelineIds: [] },
        suggestedAngle: { evidenceIds: ["sam-attendance-linkedin", "sam-currency-expansion", "sam-fx-job"], timelineIds: [] },
        "drafts.email.body": { evidenceIds: ["sam-attendance-linkedin", "sam-currency-expansion"], timelineIds: [] },
        "drafts.linkedIn.body": { evidenceIds: ["sam-attendance-linkedin", "sam-currency-expansion"], timelineIds: [] },
        nextAction: { evidenceIds: ["sam-attendance-linkedin", "sam-email-pattern"], timelineIds: [] },
      },
      david: {
        "identity.name": { evidenceIds: ["david-profile-company"], timelineIds: [] },
        "identity.title": { evidenceIds: ["david-profile-company"], timelineIds: [] },
        "identity.company": { evidenceIds: ["david-profile-company"], timelineIds: [] },
        headline: { evidenceIds: ["david-agenda-panel", "david-crm-history"], timelineIds: [] },
        prepStatus: { evidenceIds: ["david-crm-history"], timelineIds: [] },
        "contact.linkedIn": { evidenceIds: ["david-profile-company"], timelineIds: [] },
        "contact.email": { evidenceIds: ["david-crm-history"], timelineIds: [] },
        "attendanceEvidence.0": { evidenceIds: ["david-agenda-panel"], timelineIds: [] },
        "attendanceEvidence.1": { evidenceIds: ["david-x-panel"], timelineIds: [] },
        "whyThisPersonMatters.0": { evidenceIds: ["david-profile-company"], timelineIds: [] },
        "whyThisPersonMatters.1": { evidenceIds: ["david-profile-company"], timelineIds: [] },
        "whyThisPersonMatters.2": { evidenceIds: ["david-profile-company"], timelineIds: [] },
        "whyThisPersonMatters.3": { evidenceIds: ["david-fx-margin"], timelineIds: [] },
        "whyThisPersonMatters.4": { evidenceIds: ["david-forwards", "david-bank-inference"], timelineIds: [] },
        "whyThisPersonMatters.5": { evidenceIds: ["david-provider-unknown"], timelineIds: [] },
        "relationshipHistory.0": { evidenceIds: ["david-crm-history"], timelineIds: [] },
        "relationshipHistory.1": { evidenceIds: ["david-crm-history"], timelineIds: [] },
        "relationshipHistory.2": { evidenceIds: ["david-crm-history"], timelineIds: [] },
        "relationshipHistory.3": { evidenceIds: ["david-crm-history"], timelineIds: [] },
        "recentSignals.0": { evidenceIds: ["david-x-panel"], timelineIds: [] },
        "recentSignals.1": { evidenceIds: ["david-fx-margin", "david-forwards"], timelineIds: [] },
        "recentSignals.2": { evidenceIds: ["david-thai-acquisition"], timelineIds: [] },
        suggestedAngle: { evidenceIds: ["david-crm-history", "david-fx-margin", "david-thai-acquisition", "david-agenda-panel"], timelineIds: [] },
        coordinationStep: { evidenceIds: ["david-crm-history", "david-agenda-panel"], timelineIds: [] },
        "relationshipRead.text": { evidenceIds: ["david-crm-history"], timelineIds: [] },
        "relationshipRead.counterEvidence.0": { evidenceIds: ["david-crm-history"], timelineIds: [] },
        "relationshipRead.counterEvidence.1": { evidenceIds: ["david-crm-history"], timelineIds: [] },
        "drafts.email.body": { evidenceIds: ["david-agenda-panel", "david-forwards", "david-thai-acquisition"], timelineIds: [] },
        nextAction: { evidenceIds: ["david-crm-history"], timelineIds: [] },
      },
      priya: {
        "identity.name": { evidenceIds: ["priya-profile-company"], timelineIds: [] },
        "identity.title": { evidenceIds: ["priya-role"], timelineIds: [] },
        "identity.company": { evidenceIds: ["priya-profile-company"], timelineIds: [] },
        headline: { evidenceIds: ["priya-dinner-rsvp", "priya-crm-gap"], timelineIds: [] },
        prepStatus: { evidenceIds: ["priya-crm-gap"], timelineIds: [] },
        "contact.linkedIn": { evidenceIds: ["priya-profile-company"], timelineIds: [] },
        "contact.emailGap": { evidenceIds: ["priya-crm-gap"], timelineIds: [] },
        "attendanceEvidence.0": { evidenceIds: ["priya-dinner-rsvp"], timelineIds: [] },
        "attendanceEvidence.1": { evidenceIds: ["priya-speaker-sponsor-gap"], timelineIds: [] },
        "whyThisPersonMatters.0": { evidenceIds: ["priya-profile-company"], timelineIds: [] },
        "whyThisPersonMatters.1": { evidenceIds: ["priya-role"], timelineIds: [] },
        "whyThisPersonMatters.2": { evidenceIds: ["priya-profile-company"], timelineIds: [] },
        "whyThisPersonMatters.3": { evidenceIds: ["priya-payouts"], timelineIds: [] },
        "whyThisPersonMatters.4": { evidenceIds: ["priya-fx-owner-unknown"], timelineIds: [] },
        "whyThisPersonMatters.5": { evidenceIds: ["priya-provider-hedging-unknown"], timelineIds: [] },
        "whyThisPersonMatters.6": { evidenceIds: ["priya-provider-hedging-unknown"], timelineIds: [] },
        "relationshipHistory.0": { evidenceIds: ["priya-crm-gap"], timelineIds: [] },
        "recentSignals.0": { evidenceIds: ["priya-dinner-rsvp"], timelineIds: [] },
        "recentSignals.1": { evidenceIds: ["priya-payouts"], timelineIds: [] },
        "recentSignals.2": { evidenceIds: ["priya-series-c"], timelineIds: [] },
        suggestedAngle: { evidenceIds: ["priya-payouts", "priya-fx-owner-unknown"], timelineIds: [] },
        "relationshipRead.counterEvidence.0": { evidenceIds: ["priya-dinner-rsvp"], timelineIds: [] },
        "relationshipRead.counterEvidence.1": { evidenceIds: ["priya-fx-owner-unknown"], timelineIds: [] },
        "drafts.linkedIn.body": { evidenceIds: ["priya-dinner-rsvp", "priya-payouts", "priya-fx-owner-unknown"], timelineIds: [] },
        nextAction: { evidenceIds: ["priya-dinner-rsvp", "priya-crm-gap"], timelineIds: [] },
      },
      marcus: {
        "identity.name": { evidenceIds: ["marcus-profile-company"], timelineIds: [] },
        "identity.title": { evidenceIds: ["marcus-profile-company"], timelineIds: [] },
        "identity.company": { evidenceIds: ["marcus-profile-company"], timelineIds: [] },
        headline: { evidenceIds: ["marcus-speaker-current", "marcus-prior-encounter"], timelineIds: [] },
        prepStatus: { evidenceIds: ["marcus-speaker-current"], timelineIds: [] },
        "contact.linkedIn": { evidenceIds: ["marcus-profile-company"], timelineIds: [] },
        "contact.email": { evidenceIds: ["marcus-profile-company"], timelineIds: ["reply-marcus-new-year"] },
        "attendanceEvidence.0": { evidenceIds: ["marcus-speaker-current"], timelineIds: [] },
        "attendanceEvidence.1": { evidenceIds: ["marcus-speaker-prior"], timelineIds: [] },
        "whyThisPersonMatters.0": { evidenceIds: ["marcus-profile-company"], timelineIds: [] },
        "whyThisPersonMatters.1": { evidenceIds: ["marcus-prior-encounter"], timelineIds: ["enc-marcus-money20-prior"] },
        "whyThisPersonMatters.2": { evidenceIds: ["marcus-profile-company"], timelineIds: [] },
        "whyThisPersonMatters.3": { evidenceIds: ["marcus-series-c"], timelineIds: [] },
        "whyThisPersonMatters.4": { evidenceIds: ["marcus-prior-encounter"], timelineIds: ["enc-marcus-money20-prior"] },
        "whyThisPersonMatters.5": { evidenceIds: ["marcus-prior-encounter"], timelineIds: ["enc-marcus-money20-prior"] },
        "relationshipHistory.0": { evidenceIds: ["marcus-prior-encounter"], timelineIds: ["enc-marcus-money20-prior"] },
        "relationshipHistory.1": { evidenceIds: [], timelineIds: ["outreach-marcus-one-pager", "reply-marcus-new-year"] },
        "relationshipHistory.2": { evidenceIds: [], timelineIds: ["outreach-marcus-second-follow-up"] },
        "relationshipHistory.3": { evidenceIds: [], timelineIds: ["observation-marcus-linkedin-like"] },
        "relationshipHistory.4": { evidenceIds: ["marcus-prior-encounter"], timelineIds: [] },
        "relationshipHistory.5": { evidenceIds: ["marcus-speaker-current"], timelineIds: [] },
        "recentSignals.0": { evidenceIds: ["marcus-speaker-current"], timelineIds: [] },
        "recentSignals.1": { evidenceIds: ["marcus-series-c"], timelineIds: [] },
        "recentSignals.2": { evidenceIds: ["marcus-fx-job"], timelineIds: [] },
        suggestedAngle: { evidenceIds: ["marcus-prior-encounter", "marcus-series-c", "marcus-warming-hypothesis", "marcus-speaker-current"], timelineIds: ["enc-marcus-money20-prior"] },
        "relationshipRead.text": { evidenceIds: ["marcus-warming-hypothesis"], timelineIds: ["enc-marcus-money20-prior", "outreach-marcus-second-follow-up"] },
        "relationshipRead.counterEvidence.0": { evidenceIds: [], timelineIds: ["outreach-marcus-second-follow-up"] },
        "relationshipRead.counterEvidence.1": { evidenceIds: ["marcus-warming-hypothesis"], timelineIds: ["observation-marcus-linkedin-like"] },
        "relationshipRead.counterEvidence.2": { evidenceIds: [], timelineIds: ["enc-marcus-money20-prior"] },
        "drafts.email.body": { evidenceIds: ["marcus-prior-encounter", "marcus-series-c", "marcus-speaker-current"], timelineIds: ["enc-marcus-money20-prior"] },
        "drafts.linkedIn.body": { evidenceIds: ["marcus-speaker-current", "marcus-prior-encounter", "marcus-series-c"], timelineIds: ["enc-marcus-money20-prior"] },
        nextAction: { evidenceIds: ["marcus-speaker-current"], timelineIds: ["reply-marcus-new-year"] },
      },
    } as const;

    for (const personId of FULL_PROFILE_IDS) {
      const profile = PROFILES[personId];
      const inventory = PROFILE_CLAIMS[personId];
      const expectedPaths = Object.keys(expectedSupport[personId]).sort();

      expect(inventory.companyId).toBe(expectedCompanyIds[personId]);
      expect(inventory.claims.map((claim) => claim.displayPath).sort()).toEqual(expectedPaths);
      expect(expectedPaths).toEqual([
        "identity.name", "identity.title", "identity.company", "headline", "prepStatus",
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
      ].sort());
      for (const claim of inventory.claims) {
        expect(claim.evidenceIds.length + claim.timelineIds.length, `${personId}:${claim.displayPath}`).toBeGreaterThan(0);
        expect(
          { evidenceIds: claim.evidenceIds, timelineIds: claim.timelineIds },
          `${personId}:${claim.displayPath}`,
        ).toEqual(expectedSupport[personId][claim.displayPath as keyof typeof expectedSupport[typeof personId]]);
        for (const evidenceId of claim.evidenceIds) {
          const evidence = evidenceById.get(evidenceId);
          expect(evidence, `${personId}:${claim.displayPath}:${evidenceId}`).toBeDefined();
          expect(evidence?.personId).toBe(personId);
          expect(evidence?.companyId).toBe(inventory.companyId);
        }
        for (const timelineId of claim.timelineIds) {
          const timeline = timelineById.get(timelineId) as (typeof workspace.timeline)[number] & { companyId?: string };
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
