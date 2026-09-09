import { evidenceRecordSchema, prepSnapshotSchema } from "@/domain/schemas";
import type {
  AttendanceConfidence,
  CrmState,
  EvidenceRecord,
  PrepSnapshot,
  TimelineEntry,
} from "@/domain/types";

export const FULL_PROFILE_IDS = ["sam", "david", "priya", "marcus"] as const;
export type FullProfileId = (typeof FULL_PROFILE_IDS)[number];

interface DraftFixture {
  sourceLabel: string;
  subject: string | null;
  body: string;
  actualWordCount: number;
}

interface ProfileFixture {
  id: FullProfileId;
  fictionalLabel: "Fictional demo scenario";
  name: string;
  title: string;
  company: string;
  headline: string;
  prepStatus: string;
  contact: {
    linkedIn: { value: string; confidence: "verified" };
    email: { value: string; confidence: "verified" | "inferred" } | null;
  };
  actions: { openEmail: boolean; exactCrmIdentity: boolean };
  attendanceEvidence: string[];
  whyThisPersonMatters: string[];
  relationshipHistory: string[];
  recentSignals: string[];
  suggestedAngle: string;
  coordinationStep: string | null;
  requiresCoordination: boolean;
  relationshipRead: {
    label: string;
    text: string | null;
    counterEvidence: string[];
  };
  drafts: { email: DraftFixture | null; linkedIn: DraftFixture | null };
  nextAction: string;
  scheduleWarning: string;
  evidence: EvidenceRecord[];
}

const DISCOVERED_AT = "2026-05-20T09:12:00.000Z";
const EDITION = "Money20/20 Europe — illustrative 2–4 June demo scenario";
const SCHEDULE_WARNING =
  "Illustrative dates and weekday references must be flagged for review before real outreach.";

function wordCount(text: string): number {
  return text.trim().split(/\s+/u).filter(Boolean).length;
}

function draft(sourceLabel: string, subject: string | null, body: string): DraftFixture {
  return { sourceLabel, subject, body, actualWordCount: wordCount(body) };
}

function fictionalEvidence(
  id: string,
  personId: string | null,
  companyId: string,
  claim: string,
  quote: string | null,
  platform: string,
  tag: EvidenceRecord["tag"],
  publishedAt: string | null,
): EvidenceRecord {
  return evidenceRecordSchema.parse({
    id,
    personId,
    companyId,
    edition: EDITION,
    claim,
    quote,
    exhibitUrl: `/evidence/${
      personId && FULL_PROFILE_IDS.includes(personId as FullProfileId)
        ? personId
        : "edge-fixtures"
    }.html#${id}`,
    platform,
    publishedAt,
    discoveredAt: DISCOVERED_AT,
    tag,
    origin: "fictional_demo",
  });
}

const samEmailBody =
  "Hi Sam, saw your post about Money20/20 and swapping notes on multi-currency settlement. Happy to. Six new settlement currencies in two quarters is a lot of new exposure, and most PSPs at that stage are still hedging manually or not at all. Grain helps payments companies lock rates on cross-border flows without a treasury desk. Would 15 minutes on Tuesday afternoon work? I'm around all three days. Best, [Rep]";
const samLinkedInBody =
  "Hi Sam, saw you're heading to Amsterdam and want to swap notes on multi-currency settlement. Same here. We work with PSPs on exactly the exposure that comes with adding currencies like MXN and BRL. Coffee Tuesday afternoon at the show?";
const davidEmailBody =
  "Hi David, I'll be at your panel on Thursday. The one-currency-in, another-currency-out problem is most of what we do at Grain for travel wholesalers. Your FY25 report mentioned forwards covering part of committed inventory. Curious how you decide what portion, especially with THB now in the mix. Would you have 15 minutes after the panel or on Friday morning? Happy to share what we're seeing across other bed banks. Best, [Rep]";
const priyaLinkedInBody =
  "Hi Priya, looks like we'll both be at the Founders Dinner on Monday. Congrats on the BRL and MXN payouts. Quick question I'm curious about as someone who works on FX for marketplaces: does Lumio hold the currency exposure on those, or does your payout partner? Happy to compare notes at the dinner.";
const marcusEmailBody =
  "Hi Marcus, we spoke at Grain's booth last year. You were hedging the majors through your bank and absorbing the rest while you evaluated options. Since then you've raised and committed to 12 new corridors across Africa and LATAM, which sounds like ‘the rest’ just became the main event. I'll be at your fireside chat Wednesday. Could we grab 20 minutes afterwards? I'd like to show you what we've built for exactly those corridors since we last spoke. Best, [Rep]";
const marcusLinkedInBody =
  "Hi Marcus, good to see you're speaking again this year. We spoke at the booth last time about hedging beyond the majors. With the 12 new corridors, that problem's probably grown. I'll be at your session Wednesday. Twenty minutes after for a coffee?";

export const PROFILES: Record<FullProfileId, ProfileFixture> = {
  sam: {
    id: "sam",
    fictionalLabel: "Fictional demo scenario",
    name: "Sam Jones",
    title: "Head of Treasury",
    company: "Acme Payments",
    headline: "Confirmed attending · Tier A · Not in HubSpot",
    prepStatus: "To contact",
    contact: {
      linkedIn: { value: "linkedin.com/in/samjones-treasury", confidence: "verified" },
      email: { value: "sam.jones@acmepayments.com", confidence: "inferred" },
    },
    actions: { openEmail: false, exactCrmIdentity: false },
    attendanceEvidence: [
      "LinkedIn, 3 days ago: “Heading to Money20/20 Amsterdam next week. Who else is going? Would love to swap notes on multi-currency settlement.” — Verified fictional exhibit.",
    ],
    whyThisPersonMatters: [
      "Head of Treasury since January 2025; previously Treasury Manager at a UK e-commerce group — fictional LinkedIn exhibit, Verified.",
      "Posts roughly monthly, mostly about settlement timing, cash forecasting, and payment-rail costs — Cited.",
      "Role fit: decision maker for hedging and FX provider selection — Inferred from title, not an authorization fact.",
      "Acme Payments is a fictional payment service provider for mid-size European merchants selling cross-border, with about 280 staff, London HQ, and offices in Berlin and Lisbon — fictional company exhibit, Verified.",
      "Acme settles merchants in 14 currencies and added PLN, CZK, SEK, NOK, MXN, and BRL in the last two quarters — fictional Q1 product-update exhibit, Verified.",
      "A fictional FX & Liquidity Analyst job has been live for three weeks — fictional careers exhibit, Verified.",
      "Current FX provider: Unknown.",
      "Hedging today: Unknown; no fictional public mention is supplied.",
    ],
    relationshipHistory: ["None. No HubSpot record for the person or the company."],
    recentSignals: [
      "3 days ago — Sam's fictional LinkedIn post about attending.",
      "6 weeks ago — fictional company blog: six new settlement currencies launched.",
      "3 weeks ago — fictional careers page: FX & Liquidity Analyst role opened.",
    ],
    suggestedAngle:
      "Six new settlement currencies in two quarters, two of them emerging-market, plus hiring an FX analyst, says Acme's FX exposure just grew faster than their treasury tooling. Sam publicly asked to “swap notes on multi-currency settlement.” Take him at his word and offer exactly that. The tooling conclusion is explicitly inferred from the fictional premises.",
    coordinationStep: null,
    requiresCoordination: false,
    relationshipRead: { label: "No prior relationship", text: null, counterEvidence: [] },
    drafts: {
      email: draft("Draft email (72 words — illustrative source label)", "Multi-currency settlement notes, Amsterdam", samEmailBody),
      linkedIn: draft("Draft LinkedIn DM (41 words — illustrative source label)", null, samLinkedInBody),
    },
    nextAction:
      "Send the LinkedIn DM today while his fictional post is fresh. Email is only example copy and must remain disabled until the inferred address is verified; if verified later, use it as a follow-up in 3 days if no reply.",
    scheduleWarning: SCHEDULE_WARNING,
    evidence: [
      fictionalEvidence("sam-attendance-linkedin", "sam", "acme-payments", "Sam announced attendance and asked to swap notes on multi-currency settlement.", "Heading to Money20/20 Amsterdam next week. Who else is going? Would love to swap notes on multi-currency settlement.", "LinkedIn exhibit", "verified", "2026-05-17"),
      fictionalEvidence("sam-role-linkedin", "sam", "acme-payments", "Sam is Head of Treasury since January 2025.", null, "LinkedIn exhibit", "verified", "2026-05-20"),
      fictionalEvidence("sam-posting-pattern", "sam", "acme-payments", "Sam posts roughly monthly about settlement and treasury operations.", null, "Local research summary", "cited", null),
      fictionalEvidence("sam-email-pattern", "sam", "acme-payments", "The email follows a pattern seen on two fictional press contacts but is not verified.", null, "Local email-pattern exhibit", "inferred", null),
      fictionalEvidence("sam-provider-unknown", "sam", "acme-payments", "Current FX provider and hedging approach are unknown.", null, "Local evidence gap", "unknown", null),
    ],
  },
  david: {
    id: "david",
    fictionalLabel: "Fictional demo scenario",
    name: "David Cohen",
    title: "CFO",
    company: "Northwind Travel Group",
    headline: "Confirmed attending (speaker) · Tier A · In HubSpot · owned by another rep · last activity 14 months ago",
    prepStatus: "Needs coordination",
    contact: {
      linkedIn: { value: "linkedin.com/in/davidcohen-cfo", confidence: "verified" },
      email: { value: "d.cohen@northwindtravel.com", confidence: "verified" },
    },
    actions: { openEmail: true, exactCrmIdentity: true },
    attendanceEvidence: [
      "Fictional agenda: panel “Treasury in travel: managing volatility when you pay in one currency and sell in another”, Thursday 14:00 — Verified fictional exhibit.",
      "Fictional X post, 9 days ago: “Speaking on the treasury panel at Money20/20 Thursday 2pm. Come say hi.” — Verified fictional exhibit.",
    ],
    whyThisPersonMatters: [
      "CFO since 2022, previously Finance Director at a fictional hotel bed bank — Verified fictional profile exhibit.",
      "Role fit: decision maker is an inference from the CFO title and the absence of a separate treasurer in the fictional profile; it is not independently verified authority.",
      "Northwind is a fictional B2B travel wholesaler buying inventory in EUR, USD, and THB and selling to agents in GBP, ILS, and ZAR, with about 600 staff — fictional annual-report exhibit, Verified.",
      "Fictional FY2025 annual report: “Adverse currency movements reduced gross margin by approximately 1.8 percentage points.” — Verified fictional exhibit.",
      "Fictional report: “The Group uses forward contracts on a portion of its committed inventory purchases.” — Verified; the conclusion that this is likely through a bank is Inferred.",
      "Current provider: Unknown.",
    ],
    relationshipHistory: [
      "HubSpot contact created 20 months ago by a colleague after an inbound webinar signup.",
      "Last activity 14 months ago: a follow-up email, no reply.",
      "Colleague's note: “Said FX is handled by their bank, not a priority this year. Revisit.”",
      "No open deal.",
    ],
    recentSignals: [
      "9 days ago — fictional X post about the panel.",
      "4 months ago — fictional annual report: 1.8 percentage-point margin hit from FX and partial hedging.",
      "7 months ago — fictional press exhibit: acquired a small DMC in Thailand, adding a THB cost base.",
    ],
    suggestedAngle:
      "Fourteen months ago FX “wasn't a priority.” Since then the fictional annual report put a number on the pain and Northwind added a Thai cost base. David is now speaking on a panel about exactly this. The topic has moved from “not a priority” to “on stage.” The angle is the panel itself: ask a real question about it, while keeping likely bank usage visibly inferred.",
    coordinationStep:
      "This contact is owned by [colleague]. Copy coordination message / Open Slack: “David Cohen from Northwind is speaking on the treasury panel at Money20/20 Thursday. Your note from last year said revisit. I'll be there. OK if I reach out and reference the panel, or do you want to?” No message is sent by the application.",
    requiresCoordination: true,
    relationshipRead: { label: "Dormant CRM relationship", text: "Owned by another rep; coordinate before prospect draft actions.", counterEvidence: ["No reply to the last follow-up.", "No open deal."] },
    drafts: {
      email: draft("Draft email (78 words — illustrative source label; unlocked after coordination)", "Your treasury panel on Thursday", davidEmailBody),
      linkedIn: null,
    },
    nextAction:
      "Coordinate with the owner first. Then email, not DM, because the relationship exists and David is a CFO. Illustrative Thursday and Friday timing must be reviewed before use.",
    scheduleWarning: SCHEDULE_WARNING,
    evidence: [
      fictionalEvidence("david-agenda-panel", "david", "northwind-travel", "David is listed on the fictional treasury panel.", "Treasury in travel: managing volatility when you pay in one currency and sell in another", "Agenda exhibit", "verified", "2026-05-20"),
      fictionalEvidence("david-x-panel", "david", "northwind-travel", "David announced the fictional panel appearance.", "Speaking on the treasury panel at Money20/20 Thursday 2pm. Come say hi.", "X exhibit", "verified", "2026-05-11"),
      fictionalEvidence("david-fx-margin", "david", "northwind-travel", "The fictional annual report quantifies an FX margin impact.", "Adverse currency movements reduced gross margin by approximately 1.8 percentage points.", "Annual report exhibit", "verified", "2026-01-20"),
      fictionalEvidence("david-bank-inference", "david", "northwind-travel", "Use of a bank for hedging is inferred, not stated.", null, "Local inference exhibit", "inferred", null),
    ],
  },
  priya: {
    id: "priya",
    fictionalLabel: "Fictional demo scenario",
    name: "Priya Natarajan",
    title: "VP Payments",
    company: "Lumio Marketplace",
    headline: "Likely attending · Tier B · Not in HubSpot",
    prepStatus: "To contact",
    contact: {
      linkedIn: { value: "linkedin.com/in/priyanatarajan", confidence: "verified" },
      email: null,
    },
    actions: { openEmail: false, exactCrmIdentity: false },
    attendanceEvidence: [
      "Fictional Luma RSVP, 5 days ago: going to “Fintech Founders Dinner”, the night before the illustrative Money20/20 schedule — Verified fictional exhibit.",
      "Not on the fictional speaker list. The fictional company is not a sponsor — Verified local exhibit.",
    ],
    whyThisPersonMatters: [
      "VP Payments for 18 months, previously led payouts at a fictional gig-economy platform — Verified fictional profile exhibit.",
      "Role fit: influencer; she owns the payout product, while hedging decisions likely sit with finance — Inferred.",
      "Lumio is a fictional online marketplace for independent home-goods makers, paying sellers in 30 countries, with about 900 staff and Dublin HQ — Verified fictional company exhibit.",
      "Fictional product blog: local-currency seller payouts in Brazil and Mexico announced two months ago — Verified.",
      "Whether Lumio or its payout provider carries the FX is Unknown; this is the qualification question that determines fit.",
      "Hedging today: Unknown.",
      "Current provider: Unknown.",
    ],
    relationshipHistory: ["None."],
    recentSignals: [
      "5 days ago — fictional side-event RSVP.",
      "2 months ago — fictional product blog: local-currency payouts in BRL and MXN.",
      "5 months ago — fictional Series C announcement naming LATAM and Southeast Asia expansion as use of funds.",
    ],
    suggestedAngle:
      "Too many unknowns to pitch. The right move is a question, not a claim. Local-currency payouts in BRL and MXN mean someone is holding the FX between the buyer's currency and the seller's. Ask who. If it is Lumio, the company may be Tier A; if it is the payout provider, move on politely. No email address is guessed or offered.",
    coordinationStep: null,
    requiresCoordination: false,
    relationshipRead: { label: "No prior relationship", text: null, counterEvidence: ["Attendance is Likely, not Confirmed.", "FX ownership is Unknown."] },
    drafts: {
      email: null,
      linkedIn: draft("Draft LinkedIn DM (48 words — illustrative source label)", null, priyaLinkedInBody),
    },
    nextAction:
      "Send the LinkedIn DM before the fictional dinner, qualify in person, and update the tier after. No email action is available because the address is Unknown.",
    scheduleWarning: SCHEDULE_WARNING,
    evidence: [
      fictionalEvidence("priya-dinner-rsvp", "priya", "lumio-marketplace", "Priya RSVP'd to the fictional Fintech Founders Dinner.", "Going to Fintech Founders Dinner, the night before Money20/20", "Luma exhibit", "verified", "2026-05-15"),
      fictionalEvidence("priya-role", "priya", "lumio-marketplace", "Priya is VP Payments; influence over FX is inferred.", null, "Profile exhibit", "inferred", "2026-05-20"),
      fictionalEvidence("priya-payouts", "priya", "lumio-marketplace", "Lumio announced fictional BRL and MXN local-currency payouts.", null, "Product blog exhibit", "verified", "2026-03-20"),
      fictionalEvidence("priya-fx-owner-unknown", "priya", "lumio-marketplace", "Which party carries the FX exposure is unknown.", null, "Local evidence gap", "unknown", null),
    ],
  },
  marcus: {
    id: "marcus",
    fictionalLabel: "Fictional demo scenario",
    name: "Marcus Oyelaran",
    title: "Treasury Director",
    company: "Payloom",
    headline: "Confirmed attending (speaker) · Tier A · In HubSpot · owned by me",
    prepStatus: "To contact",
    contact: {
      linkedIn: { value: "linkedin.com/in/marcusoyelaran", confidence: "verified" },
      email: { value: "marcus@payloom.io", confidence: "verified" },
    },
    actions: { openEmail: true, exactCrmIdentity: true },
    attendanceEvidence: [
      "Fictional speakers page: fireside chat “Building payouts into 40 markets”, Wednesday 11:30 — Verified fictional exhibit.",
      "Spoke at last year's fictional edition too — Verified historical programme exhibit.",
    ],
    whyThisPersonMatters: [
      "Treasury Director since 2023 and built Payloom's fictional treasury function from scratch — Verified fictional profile exhibit.",
      "Role fit: decision maker — Verified from the supplied fictional prior-meeting note.",
      "Payloom is a fictional cross-border payouts platform for platforms and marketplaces, with 40 payout markets, 28 currencies, about 350 staff, and Amsterdam HQ — Verified fictional company exhibit.",
      "Fictional Series C seven months ago was described as funding 12 new corridors across Africa and LATAM — Verified fictional release.",
      "Last year Marcus said Payloom hedges “the big pairs with our bank, the rest we eat” — Verified internal fictional field note.",
      "Current provider: an unnamed bank — Cited from that prior fictional conversation.",
    ],
    relationshipHistory: [
      "12 months ago, this conference (actual field capture): “Good chat at the booth. Hedges majors with bank, eats the rest. Evaluating two fintech providers. Said revisit Q1.”",
      "11 months ago: follow-up email sent with a one-pager. He replied: “Thanks, will come back to you in the new year.”",
      "8 months ago: second follow-up. No reply.",
      "5 months ago: he liked a fictional Grain LinkedIn post about emerging-market corridors.",
      "No open deal. Lifecycle stage: Lead.",
      "Planned second encounter: Wednesday 11:30 after the illustrative fireside chat. It becomes “2nd encounter” only after capture saves an actual meeting.",
    ],
    recentSignals: [
      "Speaker at this fictional event again.",
      "7 months ago — fictional Series C for 12 new corridors in Africa and LATAM.",
      "3 months ago — fictional Payloom job post: “Treasury Analyst, emerging markets FX”.",
    ],
    suggestedAngle:
      "Last year he said the majors are hedged and the rest they absorb. The fictional Series C adds 12 corridors, but the conclusion that “the rest” becomes most of the business is unsupported and must remain flagged as inference in editable example copy. The fireside-chat title concerns expansion, so reference last year's conversation as a starting point, not an excuse.",
    coordinationStep: null,
    requiresCoordination: false,
    relationshipRead: {
      label: "Illustrative hypothesis",
      text: "The supplied source copy reads “warming, not tire-kicking,” but runtime state begins unclear. Changed circumstances justify revisiting; a saved reciprocal or concrete next step is required before showing warming.",
      counterEvidence: [
        "No reply to the second follow-up eight months ago.",
        "A social like and renewed public activity do not prove buying progression.",
        "There is only one actual prior encounter before the planned meeting is captured.",
      ],
    },
    drafts: {
      email: draft("Draft email (79 words — illustrative source label)", "Picking up from last year's Money20/20", marcusEmailBody),
      linkedIn: draft("Draft LinkedIn DM (44 words — illustrative source label)", null, marcusLinkedInBody),
    },
    nextAction:
      "Email now because Marcus replied to email before. DM the day before the fictional event as a reminder. The field list shows “You planned to meet Marcus — Wednesday 11:30 fireside chat” with Met / Didn't meet; all timing requires real-date review.",
    scheduleWarning: SCHEDULE_WARNING,
    evidence: [
      fictionalEvidence("marcus-speaker-current", "marcus", "payloom", "Marcus appears on the fictional current-edition speakers page.", "Building payouts into 40 markets", "Speakers exhibit", "verified", "2026-05-20"),
      fictionalEvidence("marcus-prior-encounter", "marcus", "payloom", "One actual prior encounter records Payloom's majors-versus-other-currencies approach.", "Hedges majors with bank, eats the rest. Evaluating two fintech providers. Said revisit Q1.", "Internal field-note exhibit", "verified", "2025-06-03"),
      fictionalEvidence("marcus-series-c", "marcus", "payloom", "Payloom's fictional Series C named 12 new corridors.", null, "Press release exhibit", "verified", "2025-10-20"),
      fictionalEvidence("marcus-warming-hypothesis", "marcus", "payloom", "Warming is only an illustrative hypothesis until concrete progression is captured.", null, "Local inference exhibit", "inferred", null),
    ],
  },
};

export const EDGE_FIXTURES = {
  openDeal: {
    id: "edge-open-deal",
    fictionalLabel: "Fictional demo scenario",
    crmState: "open_deal" as CrmState,
    accountOwner: "Another rep",
    coordinationRequired: true,
    origin: "fictional_demo" as const,
  },
  probableReturner: {
    id: "edge-probable-returner",
    fictionalLabel: "Fictional demo scenario",
    attendanceConfidence: "probable_returner" as AttendanceConfidence,
    priorEditions: ["2025", "2026"],
    origin: "fictional_demo" as const,
  },
  companyOnly: {
    id: "edge-company-only",
    fictionalLabel: "Fictional demo scenario",
    personId: null,
    companyId: "meridian-remit",
    claim: "The fictional company announces a booth; no employee is named.",
    origin: "fictional_demo" as const,
  },
  cancelledSpeaker: {
    id: "edge-cancelled-speaker",
    fictionalLabel: "Fictional demo scenario",
    personId: "edge-cancelled",
    cancelled: true,
    remainingConfidence: "unknown" as AttendanceConfidence,
    evidenceId: "edge-cancelled-removed",
    origin: "fictional_demo" as const,
  },
  unknownCrm: {
    id: "edge-unknown-crm",
    fictionalLabel: "Fictional demo scenario",
    crmState: "unknown" as CrmState,
    mayCreate: false,
    origin: "fictional_demo" as const,
  },
  namesakeDomain: {
    id: "edge-namesake-domain",
    fictionalLabel: "Fictional demo scenario",
    enteredCompany: "Nova",
    candidateDomains: ["nova-payments.example", "nova-health.example"],
    reviewRequired: true,
    origin: "fictional_demo" as const,
  },
  jobChange: {
    id: "edge-job-change",
    fictionalLabel: "Fictional demo scenario",
    personId: "edge-job-change-person",
    previousCompany: "OldCo Travel",
    currentCompany: "NewCo Payments",
    preserveEncounterTimeFacts: true,
    origin: "fictional_demo" as const,
  },
  stalled: {
    id: "edge-stalled-relationship",
    fictionalLabel: "Fictional demo scenario",
    personId: "edge-stalled-person",
    progression: "none" as const,
    origin: "fictional_demo" as const,
    timeline: [
      { id: "edge-stalled-enc-1", personId: "edge-stalled-person", conferenceId: "edge-event-1", kind: "actual_encounter", occurredAt: "2025-01-10T10:00:00.000Z", summary: "Introductory conversation; no agreed next step.", company: "FictionalCo", role: "Finance Director" },
      { id: "edge-stalled-enc-2", personId: "edge-stalled-person", conferenceId: "edge-event-2", kind: "actual_encounter", occurredAt: "2025-04-15T10:00:00.000Z", summary: "Brief catch-up; no reply or progression followed.", company: "FictionalCo", role: "Finance Director" },
      { id: "edge-stalled-enc-3", personId: "edge-stalled-person", conferenceId: "edge-event-3", kind: "actual_encounter", occurredAt: "2025-08-01T10:00:00.000Z", summary: "Third conversation; no reciprocal next step.", company: "FictionalCo", role: "Finance Director" },
    ] satisfies TimelineEntry[],
  },
};

export const EDGE_EVIDENCE: EvidenceRecord[] = [
  fictionalEvidence("edge-cancelled-removed", "edge-cancelled", "fictional-cancelled-co", "The fictional speaker listing was removed from the current agenda.", null, "Edge fixture exhibit", "verified", "2026-05-27"),
  fictionalEvidence("edge-open-deal-evidence", "edge-open-deal", "fictional-open-deal-co", "The fictional CRM account has an open deal owned by another rep.", null, "Edge fixture exhibit", "verified", null),
  fictionalEvidence("edge-returner-evidence", "edge-returner", "fictional-returner-co", "The person attended two prior fictional editions, but current attendance is unconfirmed.", null, "Edge fixture exhibit", "inferred", null),
  fictionalEvidence("edge-company-only-evidence", null, "meridian-remit", "The fictional company announced attendance without naming an individual.", null, "Edge fixture exhibit", "cited", "2026-08-18"),
];

export const ALL_EVIDENCE: EvidenceRecord[] = [
  ...Object.values(PROFILES).flatMap((profile) => profile.evidence),
  ...EDGE_EVIDENCE,
];

const moneySnapshot1 = prepSnapshotSchema.parse({
  id: "money20-eu-demo-snapshot-1",
  conferenceId: "money20-eu-demo",
  researchedAt: "2026-05-20T09:12:00.000Z",
  simulatedAt: null,
  records: [
    { id: "money-sam", personId: "sam", companyId: "acme-payments", attendanceConfidence: "confirmed", companyTier: "A", roleFit: "decision_maker", crmState: "not_present", prepStatus: "to_contact", evidenceIds: ["sam-attendance-linkedin"], currentEdition: true, cancelled: false },
    { id: "money-david", personId: "david", companyId: "northwind-travel", attendanceConfidence: "confirmed", companyTier: "A", roleFit: "decision_maker", crmState: "owned_by_other", prepStatus: "to_contact", evidenceIds: ["david-agenda-panel"], currentEdition: true, cancelled: false },
    { id: "money-priya", personId: "priya", companyId: "lumio-marketplace", attendanceConfidence: "likely", companyTier: "B", roleFit: "influencer", crmState: "not_present", prepStatus: "to_contact", evidenceIds: ["priya-dinner-rsvp"], currentEdition: true, cancelled: false },
    { id: "money-marcus", personId: "marcus", companyId: "payloom", attendanceConfidence: "confirmed", companyTier: "A", roleFit: "decision_maker", crmState: "owned_by_me", prepStatus: "to_contact", evidenceIds: ["marcus-speaker-current"], currentEdition: true, cancelled: false },
  ],
});

const moneySnapshot2 = prepSnapshotSchema.parse({
  id: "money20-eu-demo-snapshot-2",
  conferenceId: "money20-eu-demo",
  researchedAt: "2026-05-27T08:40:00.000Z",
  simulatedAt: null,
  records: [
    ...moneySnapshot1.records,
    { id: "money-cancelled", personId: "edge-cancelled", companyId: "fictional-cancelled-co", attendanceConfidence: "unknown", companyTier: "B", roleFit: "influencer", crmState: "unknown", prepStatus: "not_now", evidenceIds: ["edge-cancelled-removed"], currentEdition: true, cancelled: true },
  ],
});

const euroFinanceSnapshot = prepSnapshotSchema.parse({
  id: "eurofinance-demo-snapshot-1",
  conferenceId: "eurofinance-2026",
  researchedAt: "2026-09-02T07:30:00.000Z",
  simulatedAt: null,
  records: [
    { id: "euro-open-deal", personId: "edge-open-deal", companyId: "fictional-open-deal-co", attendanceConfidence: "confirmed", companyTier: "A", roleFit: "decision_maker", crmState: "open_deal", prepStatus: "to_contact", evidenceIds: ["edge-open-deal-evidence"], currentEdition: true, cancelled: false },
    { id: "euro-returner", personId: "edge-returner", companyId: "fictional-returner-co", attendanceConfidence: "probable_returner", companyTier: "A", roleFit: "influencer", crmState: "unknown", prepStatus: "to_contact", evidenceIds: ["edge-returner-evidence"], currentEdition: false, cancelled: false },
    { id: "euro-company-only", personId: null, companyId: "meridian-remit", attendanceConfidence: "likely", companyTier: "A", roleFit: "unknown", crmState: "not_present", prepStatus: "to_contact", evidenceIds: ["edge-company-only-evidence"], currentEdition: true, cancelled: false },
  ],
});

export const PREP_SNAPSHOTS: PrepSnapshot[] = [
  moneySnapshot1,
  moneySnapshot2,
  euroFinanceSnapshot,
];
