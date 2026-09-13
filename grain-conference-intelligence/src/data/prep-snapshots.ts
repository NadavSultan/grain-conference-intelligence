import { evidenceRecordSchema, prepSnapshotSchema, profileClaimInventorySchema } from "@/domain/schemas";
import type {
  AttendanceConfidence,
  CrmState,
  EvidenceRecord,
  ProfileClaimInventory,
  PrepSnapshot,
  TimelineEntry,
} from "@/domain/types";

export const FULL_PROFILE_IDS = ["sam", "david", "priya", "marcus"] as const;
export type FullProfileId = (typeof FULL_PROFILE_IDS)[number];

export const PROFILE_CONFERENCE_IDS: Record<string, string> = {
  sam: "money20-eu-demo",
  david: "money20-eu-demo",
  priya: "money20-eu-demo",
  marcus: "money20-eu-demo",
};

interface DraftFixture {
  sourceLabel: string;
  subject: string | null;
  body: string;
  actualWordCount: number;
}

interface ProfileFixture {
  id: string;
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
      personId && (FULL_PROFILE_IDS.includes(personId as FullProfileId) || personId === "emma" || personId === "liam")
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

function euroProfile(
  id: "emma" | "liam",
  name: string,
  title: string,
  company: string,
  email: string,
  linkedIn: string,
  roleClaim: string,
  companyClaim: string,
  signal: string,
  angle: string,
  draftBody: string,
): ProfileFixture {
  const companyId = company.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const prefix = `${id}-`;
  return {
    id,
    fictionalLabel: "Fictional demo scenario",
    name,
    title,
    company,
    headline: "Confirmed attending · Tier A · Not in HubSpot",
    prepStatus: "To contact",
    contact: { linkedIn: { value: linkedIn, confidence: "verified" }, email: { value: email, confidence: "verified" } },
    actions: { openEmail: true, exactCrmIdentity: false },
    attendanceEvidence: [`Confirmed attending: ${name} is listed for EuroFinance International Treasury Management. — Verified fictional exhibit.`],
    whyThisPersonMatters: [roleClaim, companyClaim, "Treasury role indicates a relevant buyer conversation for cross-border FX workflows — inferred from role, not an authorization fact."],
    relationshipHistory: ["None. No HubSpot record for the person or the company."],
    recentSignals: [signal, "1 week ago — EuroFinance attendee profile lists treasury and cross-border priorities."],
    suggestedAngle: angle,
    coordinationStep: null,
    requiresCoordination: false,
    relationshipRead: { label: "No prior relationship", text: null, counterEvidence: [] },
    drafts: { email: null, linkedIn: draft("Draft LinkedIn DM (illustrative source label)", null, draftBody) },
    nextAction: "Send the LinkedIn message before the conference and qualify the current FX workflow.",
    scheduleWarning: SCHEDULE_WARNING,
    evidence: [
      fictionalEvidence(`${prefix}attendance`, id, companyId, `${name} is listed as a current-edition EuroFinance attendee.`, null, "EuroFinance attendee exhibit", "verified", "2026-09-02"),
      fictionalEvidence(`${prefix}role`, id, companyId, roleClaim, null, "Profile exhibit", "verified", "2026-09-02"),
      fictionalEvidence(`${prefix}company`, id, companyId, companyClaim, null, "Company exhibit", "verified", "2026-09-02"),
      fictionalEvidence(`${prefix}signal`, id, companyId, signal, null, "Public signal exhibit", "cited", "2026-09-01"),
      fictionalEvidence(`${prefix}linkedin`, id, companyId, `Verified LinkedIn profile for ${name}.`, null, "LinkedIn exhibit", "verified", "2026-09-02"),
      fictionalEvidence(`${prefix}crm-gap`, id, companyId, "No HubSpot record for the person or the company.", null, "CRM gap exhibit", "unknown", null),
    ],
  };
}

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
      fictionalEvidence("sam-attendance-linkedin", "sam", "acme-payments", "Confirmed attending: Sam announced attendance and asked to swap notes on multi-currency settlement.", "Heading to Money20/20 Amsterdam next week. Who else is going? Would love to swap notes on multi-currency settlement.", "LinkedIn exhibit", "verified", "2026-05-17"),
      fictionalEvidence("sam-role-linkedin", "sam", "acme-payments", "Sam Jones is Head of Treasury since January 2025; previously Treasury Manager at a UK e-commerce group.", null, "LinkedIn exhibit", "verified", "2026-05-20"),
      fictionalEvidence("sam-linkedin", "sam", "acme-payments", "Verified LinkedIn profile linkedin.com/in/samjones-treasury.", null, "LinkedIn exhibit", "verified", "2026-05-20"),
      fictionalEvidence("sam-posting-pattern", "sam", "acme-payments", "Sam posts roughly monthly about settlement timing, cash forecasting, and payment-rail costs.", null, "Local research summary", "cited", null),
      fictionalEvidence("sam-email-pattern", "sam", "acme-payments", "Inferred email sam.jones@acmepayments.com matches a first.last pattern seen on two fictional press contacts and is not verified.", null, "Local email-pattern exhibit", "inferred", null),
      fictionalEvidence("sam-provider-unknown", "sam", "acme-payments", "Current FX provider: Unknown. Hedging today: Unknown; no fictional public mention is supplied.", null, "Local evidence gap", "unknown", null),
      fictionalEvidence("sam-company-facts", "sam", "acme-payments", "Acme Payments is a fictional payment service provider for mid-size European merchants selling cross-border, with about 280 staff, London HQ, and offices in Berlin and Lisbon.", null, "Company profile exhibit", "verified", "2026-05-20"),
      fictionalEvidence("sam-currency-expansion", "sam", "acme-payments", "Acme Payments settles merchants in 14 currencies and added six new settlement currencies in two quarters: PLN, CZK, SEK, NOK, MXN, and BRL.", null, "Product update exhibit", "verified", "2026-04-08"),
      fictionalEvidence("sam-fx-job", "sam", "acme-payments", "A fictional FX & Liquidity Analyst job has been live for three weeks.", null, "Careers exhibit", "verified", "2026-04-29"),
      fictionalEvidence("sam-crm-gap", "sam", "acme-payments", "Not in HubSpot. None. No HubSpot record for the person or the company.", null, "CRM gap exhibit", "unknown", null),
      fictionalEvidence("sam-role-fit", "sam", "acme-payments", "Role fit: decision maker for hedging and FX provider selection is Inferred from the Head of Treasury title, not an authorization fact.", null, "Local inference exhibit", "inferred", null),
      fictionalEvidence("sam-tier-a", "sam", "acme-payments", "Tier A is a classification inferred from Acme Payments' payments vertical, 14 currencies of FX exposure, and the Head of Treasury decision-maker role.", null, "Local classification exhibit", "inferred", null),
      fictionalEvidence("sam-tooling-inference", "sam", "acme-payments", "The conclusion that FX exposure grew faster than treasury tooling is inferred from the six new currencies and FX analyst hiring.", null, "Local inference exhibit", "inferred", null),
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
      fictionalEvidence("david-agenda-panel", "david", "northwind-travel", "Confirmed attending (speaker): David is listed on the fictional treasury panel “Treasury in travel: managing volatility when you pay in one currency and sell in another”, Thursday 14:00.", "Treasury in travel: managing volatility when you pay in one currency and sell in another", "Agenda exhibit", "verified", "2026-05-20"),
      fictionalEvidence("david-x-panel", "david", "northwind-travel", "David announced the fictional panel appearance.", "Speaking on the treasury panel at Money20/20 Thursday 2pm. Come say hi.", "X exhibit", "verified", "2026-05-11"),
      fictionalEvidence("david-fx-margin", "david", "northwind-travel", "The fictional annual report quantifies an FX margin impact of 1.8 percentage points.", "Adverse currency movements reduced gross margin by approximately 1.8 percentage points.", "Annual report exhibit", "verified", "2026-01-20"),
      fictionalEvidence("david-bank-inference", "david", "northwind-travel", "Partial forward use is verified; the conclusion that hedging is likely through a bank is Inferred.", null, "Local inference exhibit", "inferred", null),
      fictionalEvidence("david-profile-company", "david", "northwind-travel", "David Cohen is CFO of Northwind Travel Group since 2022, previously Finance Director at a fictional hotel bed bank. Northwind is a fictional B2B travel wholesaler buying inventory in EUR, USD, and THB and selling to agents in GBP, ILS, and ZAR, with about 600 staff.", null, "Profile and company exhibit", "verified", "2026-05-20"),
      fictionalEvidence("david-linkedin", "david", "northwind-travel", "Verified LinkedIn profile linkedin.com/in/davidcohen-cfo.", null, "LinkedIn exhibit", "verified", "2026-05-20"),
      fictionalEvidence("david-email", "david", "northwind-travel", "Verified HubSpot email d.cohen@northwindtravel.com.", null, "CRM exhibit", "verified", null),
      fictionalEvidence("david-forwards", "david", "northwind-travel", "The fictional annual report states that forward contracts cover a portion of committed inventory.", "The Group uses forward contracts on a portion of its committed inventory purchases.", "Annual report exhibit", "verified", "2026-01-20"),
      fictionalEvidence("david-crm-history", "david", "northwind-travel", "In HubSpot · owned by another rep · last activity 14 months ago. HubSpot contact created 20 months ago by a colleague after an inbound webinar signup. Last activity 14 months ago: a follow-up email. No reply. Colleague's note: “Said FX is handled by their bank, not a priority this year. Revisit.” FX wasn't a priority. No open deal. Coordinate before prospect draft actions. Owned by another rep.", null, "CRM exhibit", "verified", null),
      fictionalEvidence("david-thai-acquisition", "david", "northwind-travel", "Northwind's fictional acquisition added a THB cost base.", null, "Press exhibit", "verified", "2025-10-20"),
      fictionalEvidence("david-provider-unknown", "david", "northwind-travel", "Current provider: Unknown; bank usage remains inferred.", null, "Evidence gap", "unknown", null),
      fictionalEvidence("david-role-fit", "david", "northwind-travel", "Role fit: decision maker is an inference from the CFO title and the absence of a separate treasurer in the fictional profile.", null, "Local inference exhibit", "inferred", null),
      fictionalEvidence("david-tier-a", "david", "northwind-travel", "Tier A is a classification inferred from Northwind Travel Group's travel vertical, multi-currency THB/EUR/USD exposure, and the CFO decision-maker role.", null, "Local classification exhibit", "inferred", null),
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
      fictionalEvidence("priya-dinner-rsvp", "priya", "lumio-marketplace", "Likely attending: Priya RSVP'd to the fictional Fintech Founders Dinner.", "Going to Fintech Founders Dinner, the night before Money20/20", "Luma exhibit", "verified", "2026-05-15"),
      fictionalEvidence("priya-role", "priya", "lumio-marketplace", "Role fit: influencer; she owns the payout product, while hedging decisions likely sit with finance — Inferred.", null, "Profile exhibit", "inferred", "2026-05-20"),
      fictionalEvidence("priya-linkedin", "priya", "lumio-marketplace", "Verified LinkedIn profile linkedin.com/in/priyanatarajan.", null, "LinkedIn exhibit", "verified", "2026-05-20"),
      fictionalEvidence("priya-email-unknown", "priya", "lumio-marketplace", "Email is Unknown / not available. No verified address was found and none is guessed.", null, "Local evidence gap", "unknown", null),
      fictionalEvidence("priya-payouts", "priya", "lumio-marketplace", "Lumio announced fictional local-currency seller payouts in Brazil and Mexico (BRL and MXN).", null, "Product blog exhibit", "verified", "2026-03-20"),
      fictionalEvidence("priya-fx-owner-unknown", "priya", "lumio-marketplace", "Whether Lumio or its payout provider carries the FX is Unknown.", null, "Local evidence gap", "unknown", null),
      fictionalEvidence("priya-profile-company", "priya", "lumio-marketplace", "Priya Natarajan is VP Payments for 18 months, previously led payouts at a fictional gig-economy platform. Lumio Marketplace is a fictional online marketplace for independent home-goods makers, paying sellers in 30 countries, with about 900 staff and Dublin HQ.", null, "Profile and company exhibit", "verified", "2026-05-20"),
      fictionalEvidence("priya-speaker-sponsor-gap", "priya", "lumio-marketplace", "Not on the fictional speaker list. The fictional company is not a sponsor.", null, "Event-list gap exhibit", "verified", "2026-05-20"),
      fictionalEvidence("priya-provider-hedging-unknown", "priya", "lumio-marketplace", "Hedging today: Unknown. Current provider: Unknown.", null, "Evidence gap", "unknown", null),
      fictionalEvidence("priya-crm-gap", "priya", "lumio-marketplace", "Not in HubSpot. None. No prior relationship is present in the fictional CRM fixture.", null, "CRM gap exhibit", "unknown", null),
      fictionalEvidence("priya-series-c", "priya", "lumio-marketplace", "Lumio's fictional Series C names LATAM and Southeast Asia expansion.", null, "Funding exhibit", "verified", "2025-12-20"),
      fictionalEvidence("priya-tier-b", "priya", "lumio-marketplace", "Tier B is a classification inferred from Lumio Marketplace's relevant marketplace/FX signals with a material qualification gap: FX ownership is Unknown and role fit is influencer.", null, "Local classification exhibit", "inferred", null),
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
      fictionalEvidence("marcus-speaker-current", "marcus", "payloom", "Confirmed attending (speaker): Marcus appears on the fictional current-edition speakers page for the fireside chat “Building payouts into 40 markets”, Wednesday 11:30.", "Building payouts into 40 markets", "Speakers exhibit", "verified", "2026-05-20"),
      fictionalEvidence("marcus-prior-encounter", "marcus", "payloom", "One actual prior encounter records that Marcus is the decision maker for FX providers and that Payloom hedges the big pairs with our bank, the rest we eat. Said revisit Q1.", "Good chat at the booth. Hedges majors with bank, eats the rest. Evaluating two fintech providers. Said revisit Q1. He said they hedge “the big pairs with our bank, the rest we eat.”", "Internal field-note exhibit", "verified", "2025-06-03"),
      fictionalEvidence("marcus-series-c", "marcus", "payloom", "Payloom's fictional Series C named 12 new corridors across Africa and LATAM.", null, "Press release exhibit", "verified", "2025-10-20"),
      fictionalEvidence("marcus-warming-hypothesis", "marcus", "payloom", "Runtime state begins unclear. Warming is only an illustrative hypothesis. No reply to the second follow-up eight months ago. A social like and renewed public activity do not prove buying progression. There is only one actual prior encounter before the planned meeting is captured. The conclusion that “the rest” becomes most of the business is unsupported inference.", null, "Local inference exhibit", "inferred", null),
      fictionalEvidence("marcus-profile-company", "marcus", "payloom", "Marcus Oyelaran is Treasury Director since 2023 and built Payloom's fictional treasury function from scratch. Payloom is a fictional cross-border payouts platform with 40 payout markets, 28 currencies, about 350 staff, and Amsterdam HQ.", null, "Profile and company exhibit", "verified", "2026-05-20"),
      fictionalEvidence("marcus-linkedin", "marcus", "payloom", "Verified LinkedIn profile linkedin.com/in/marcusoyelaran.", null, "LinkedIn exhibit", "verified", "2026-05-20"),
      fictionalEvidence("marcus-email", "marcus", "payloom", "Verified HubSpot email marcus@payloom.io. Marcus replied to email before.", null, "CRM exhibit", "verified", null),
      fictionalEvidence("marcus-crm", "marcus", "payloom", "In HubSpot · owned by me. No open deal. Lifecycle stage: Lead.", null, "CRM exhibit", "verified", null),
      fictionalEvidence("marcus-speaker-prior", "marcus", "payloom", "Spoke at last year's fictional edition too.", null, "Historical programme exhibit", "verified", "2025-05-20"),
      fictionalEvidence("marcus-fx-job", "marcus", "payloom", "Payloom advertised a fictional job post: “Treasury Analyst, emerging markets FX”.", null, "Careers exhibit", "verified", "2026-02-20"),
      fictionalEvidence("marcus-provider-cited", "marcus", "payloom", "Current provider: an unnamed bank — Cited from the prior fictional conversation.", null, "Cited conversation exhibit", "cited", "2025-06-03"),
      fictionalEvidence("marcus-tier-a", "marcus", "payloom", "Tier A is a classification inferred from Payloom's payouts vertical, 28 currencies of FX exposure, and the Treasury Director decision-maker role.", null, "Local classification exhibit", "inferred", null),
      fictionalEvidence("marcus-planned-second", "marcus", "payloom", "Planned second encounter: Wednesday 11:30 after the illustrative fireside chat. It becomes “2nd encounter” only after capture saves an actual meeting.", null, "Seed workspace exhibit", "verified", null),
    ],
  },
};

export const ADDITIONAL_PROFILES = {
  emma: euroProfile(
    "emma", "Emma Rossi", "VP Treasury", "AtlasPay Europe", "emma.rossi@atlaspay.example", "linkedin.com/in/emma-rossi-treasury",
    "VP Treasury overseeing liquidity and FX operations across AtlasPay Europe's payment corridors.",
    "AtlasPay Europe is a fictional cross-border payments platform expanding settlement coverage across the eurozone and the Nordics.",
    "2 days ago — Emma shared that her team is reviewing treasury controls before the next corridor launch.",
    "Lead with corridor expansion and ask how AtlasPay balances local settlement timing against centralised FX execution.",
    "Hi Emma, I saw you'll be at EuroFinance. I'd be interested in comparing notes on treasury controls for new payment corridors. Would a short coffee during the event be useful?",
  ),
  liam: euroProfile(
    "liam", "Liam Becker", "Director of Corporate Treasury", "Meridian Commerce Group", "liam.becker@meridiancommerce.example", "linkedin.com/in/liam-becker-treasury",
    "Director of Corporate Treasury responsible for liquidity planning and cross-border exposure at Meridian Commerce Group.",
    "Meridian Commerce Group is a fictional European commerce business with suppliers and customers settled in multiple currencies.",
    "4 days ago — Liam commented on a treasury discussion about forward coverage for committed inventory.",
    "Ask how Meridian decides which committed cash flows to hedge and where the current process creates manual work.",
    "Hi Liam, I noticed your treasury perspective on forward coverage and that you'll be at EuroFinance. Open to a quick exchange on how you manage committed cross-border cash flows?",
  ),
} as const;

export const ALL_PROFILES: Record<string, ProfileFixture> = { ...PROFILES, ...ADDITIONAL_PROFILES };
PROFILE_CONFERENCE_IDS.emma = "eurofinance-2026";
PROFILE_CONFERENCE_IDS.liam = "eurofinance-2026";

const COMPANY_IDS: Record<FullProfileId, string> = {
  sam: "acme-payments",
  david: "northwind-travel",
  priya: "lumio-marketplace",
  marcus: "payloom",
};

function displayedPaths(profile: ProfileFixture): string[] {
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
  ];
}

type ClaimSupport = { evidenceIds: string[]; timelineIds?: string[] };

const CLAIM_SUPPORT: Record<FullProfileId, Record<string, ClaimSupport>> = {
  sam: {
    "identity.name": { evidenceIds: ["sam-role-linkedin"] },
    "identity.title": { evidenceIds: ["sam-role-linkedin"] },
    "identity.company": { evidenceIds: ["sam-company-facts"] },
    headline: { evidenceIds: ["sam-attendance-linkedin", "sam-tier-a", "sam-company-facts", "sam-currency-expansion", "sam-role-linkedin", "sam-crm-gap"] },
    "contact.linkedIn": { evidenceIds: ["sam-linkedin"] },
    "contact.email": { evidenceIds: ["sam-email-pattern"] },
    "attendanceEvidence.0": { evidenceIds: ["sam-attendance-linkedin"] },
    "whyThisPersonMatters.0": { evidenceIds: ["sam-role-linkedin"] },
    "whyThisPersonMatters.1": { evidenceIds: ["sam-posting-pattern"] },
    "whyThisPersonMatters.2": { evidenceIds: ["sam-role-fit"] },
    "whyThisPersonMatters.3": { evidenceIds: ["sam-company-facts"] },
    "whyThisPersonMatters.4": { evidenceIds: ["sam-currency-expansion"] },
    "whyThisPersonMatters.5": { evidenceIds: ["sam-fx-job"] },
    "whyThisPersonMatters.6": { evidenceIds: ["sam-provider-unknown"] },
    "whyThisPersonMatters.7": { evidenceIds: ["sam-provider-unknown"] },
    "relationshipHistory.0": { evidenceIds: ["sam-crm-gap"] },
    "recentSignals.0": { evidenceIds: ["sam-attendance-linkedin"] },
    "recentSignals.1": { evidenceIds: ["sam-currency-expansion"] },
    "recentSignals.2": { evidenceIds: ["sam-fx-job"] },
    suggestedAngle: { evidenceIds: ["sam-attendance-linkedin", "sam-currency-expansion", "sam-fx-job", "sam-tooling-inference"] },
    "drafts.email.body": { evidenceIds: ["sam-attendance-linkedin", "sam-currency-expansion"] },
    "drafts.linkedIn.body": { evidenceIds: ["sam-attendance-linkedin", "sam-currency-expansion"] },
    nextAction: { evidenceIds: ["sam-attendance-linkedin", "sam-email-pattern"] },
  },
  david: {
    "identity.name": { evidenceIds: ["david-profile-company"] },
    "identity.title": { evidenceIds: ["david-profile-company"] },
    "identity.company": { evidenceIds: ["david-profile-company"] },
    headline: { evidenceIds: ["david-agenda-panel", "david-tier-a", "david-profile-company", "david-crm-history"] },
    "contact.linkedIn": { evidenceIds: ["david-linkedin"] },
    "contact.email": { evidenceIds: ["david-email"] },
    "attendanceEvidence.0": { evidenceIds: ["david-agenda-panel"] },
    "attendanceEvidence.1": { evidenceIds: ["david-x-panel"] },
    "whyThisPersonMatters.0": { evidenceIds: ["david-profile-company"] },
    "whyThisPersonMatters.1": { evidenceIds: ["david-role-fit"] },
    "whyThisPersonMatters.2": { evidenceIds: ["david-profile-company"] },
    "whyThisPersonMatters.3": { evidenceIds: ["david-fx-margin"] },
    "whyThisPersonMatters.4": { evidenceIds: ["david-forwards", "david-bank-inference"] },
    "whyThisPersonMatters.5": { evidenceIds: ["david-provider-unknown"] },
    "relationshipHistory.0": { evidenceIds: ["david-crm-history"] },
    "relationshipHistory.1": { evidenceIds: ["david-crm-history"] },
    "relationshipHistory.2": { evidenceIds: ["david-crm-history"] },
    "relationshipHistory.3": { evidenceIds: ["david-crm-history"] },
    "recentSignals.0": { evidenceIds: ["david-x-panel"] },
    "recentSignals.1": { evidenceIds: ["david-fx-margin", "david-forwards"] },
    "recentSignals.2": { evidenceIds: ["david-thai-acquisition"] },
    suggestedAngle: { evidenceIds: ["david-crm-history", "david-fx-margin", "david-thai-acquisition", "david-agenda-panel"] },
    coordinationStep: { evidenceIds: ["david-crm-history", "david-agenda-panel"] },
    "relationshipRead.text": { evidenceIds: ["david-crm-history"] },
    "relationshipRead.counterEvidence.0": { evidenceIds: ["david-crm-history"] },
    "relationshipRead.counterEvidence.1": { evidenceIds: ["david-crm-history"] },
    "drafts.email.body": { evidenceIds: ["david-agenda-panel", "david-forwards", "david-thai-acquisition"] },
    nextAction: { evidenceIds: ["david-crm-history"] },
  },
  priya: {
    "identity.name": { evidenceIds: ["priya-profile-company"] },
    "identity.title": { evidenceIds: ["priya-profile-company"] },
    "identity.company": { evidenceIds: ["priya-profile-company"] },
    headline: { evidenceIds: ["priya-dinner-rsvp", "priya-tier-b", "priya-profile-company", "priya-fx-owner-unknown", "priya-role", "priya-crm-gap"] },
    "contact.linkedIn": { evidenceIds: ["priya-linkedin"] },
    "contact.emailGap": { evidenceIds: ["priya-email-unknown"] },
    "attendanceEvidence.0": { evidenceIds: ["priya-dinner-rsvp"] },
    "attendanceEvidence.1": { evidenceIds: ["priya-speaker-sponsor-gap"] },
    "whyThisPersonMatters.0": { evidenceIds: ["priya-profile-company"] },
    "whyThisPersonMatters.1": { evidenceIds: ["priya-role"] },
    "whyThisPersonMatters.2": { evidenceIds: ["priya-profile-company"] },
    "whyThisPersonMatters.3": { evidenceIds: ["priya-payouts"] },
    "whyThisPersonMatters.4": { evidenceIds: ["priya-fx-owner-unknown"] },
    "whyThisPersonMatters.5": { evidenceIds: ["priya-provider-hedging-unknown"] },
    "whyThisPersonMatters.6": { evidenceIds: ["priya-provider-hedging-unknown"] },
    "relationshipHistory.0": { evidenceIds: ["priya-crm-gap"] },
    "recentSignals.0": { evidenceIds: ["priya-dinner-rsvp"] },
    "recentSignals.1": { evidenceIds: ["priya-payouts"] },
    "recentSignals.2": { evidenceIds: ["priya-series-c"] },
    suggestedAngle: { evidenceIds: ["priya-payouts", "priya-fx-owner-unknown"] },
    "relationshipRead.counterEvidence.0": { evidenceIds: ["priya-dinner-rsvp"] },
    "relationshipRead.counterEvidence.1": { evidenceIds: ["priya-fx-owner-unknown"] },
    "drafts.linkedIn.body": { evidenceIds: ["priya-dinner-rsvp", "priya-payouts", "priya-fx-owner-unknown"] },
    nextAction: { evidenceIds: ["priya-dinner-rsvp", "priya-email-unknown"] },
  },
  marcus: {
    "identity.name": { evidenceIds: ["marcus-profile-company"] },
    "identity.title": { evidenceIds: ["marcus-profile-company"] },
    "identity.company": { evidenceIds: ["marcus-profile-company"] },
    headline: { evidenceIds: ["marcus-speaker-current", "marcus-tier-a", "marcus-profile-company", "marcus-crm"] },
    "contact.linkedIn": { evidenceIds: ["marcus-linkedin"] },
    "contact.email": { evidenceIds: ["marcus-email"], timelineIds: ["reply-marcus-new-year"] },
    "attendanceEvidence.0": { evidenceIds: ["marcus-speaker-current"] },
    "attendanceEvidence.1": { evidenceIds: ["marcus-speaker-prior"] },
    "whyThisPersonMatters.0": { evidenceIds: ["marcus-profile-company"] },
    "whyThisPersonMatters.1": { evidenceIds: ["marcus-prior-encounter"], timelineIds: ["enc-marcus-money20-prior"] },
    "whyThisPersonMatters.2": { evidenceIds: ["marcus-profile-company"] },
    "whyThisPersonMatters.3": { evidenceIds: ["marcus-series-c"] },
    "whyThisPersonMatters.4": { evidenceIds: ["marcus-prior-encounter"], timelineIds: ["enc-marcus-money20-prior"] },
    "whyThisPersonMatters.5": { evidenceIds: ["marcus-provider-cited"], timelineIds: ["enc-marcus-money20-prior"] },
    "relationshipHistory.0": { evidenceIds: ["marcus-prior-encounter"], timelineIds: ["enc-marcus-money20-prior"] },
    "relationshipHistory.1": { evidenceIds: [], timelineIds: ["outreach-marcus-one-pager", "reply-marcus-new-year"] },
    "relationshipHistory.2": { evidenceIds: ["marcus-warming-hypothesis"], timelineIds: ["outreach-marcus-second-follow-up"] },
    "relationshipHistory.3": { evidenceIds: [], timelineIds: ["observation-marcus-linkedin-like"] },
    "relationshipHistory.4": { evidenceIds: ["marcus-crm"] },
    "relationshipHistory.5": { evidenceIds: ["marcus-planned-second"] },
    "recentSignals.0": { evidenceIds: ["marcus-speaker-current"] },
    "recentSignals.1": { evidenceIds: ["marcus-series-c"] },
    "recentSignals.2": { evidenceIds: ["marcus-fx-job"] },
    suggestedAngle: { evidenceIds: ["marcus-prior-encounter", "marcus-series-c", "marcus-warming-hypothesis", "marcus-speaker-current"], timelineIds: ["enc-marcus-money20-prior"] },
    "relationshipRead.text": { evidenceIds: ["marcus-warming-hypothesis"], timelineIds: ["enc-marcus-money20-prior", "outreach-marcus-second-follow-up"] },
    "relationshipRead.counterEvidence.0": { evidenceIds: ["marcus-warming-hypothesis"], timelineIds: ["outreach-marcus-second-follow-up"] },
    "relationshipRead.counterEvidence.1": { evidenceIds: ["marcus-warming-hypothesis"], timelineIds: ["observation-marcus-linkedin-like"] },
    "relationshipRead.counterEvidence.2": { evidenceIds: ["marcus-warming-hypothesis"], timelineIds: ["enc-marcus-money20-prior"] },
    "drafts.email.body": { evidenceIds: ["marcus-prior-encounter", "marcus-series-c", "marcus-speaker-current"], timelineIds: ["enc-marcus-money20-prior"] },
    "drafts.linkedIn.body": { evidenceIds: ["marcus-speaker-current", "marcus-prior-encounter", "marcus-series-c"], timelineIds: ["enc-marcus-money20-prior"] },
    nextAction: { evidenceIds: ["marcus-speaker-current", "marcus-email"], timelineIds: ["reply-marcus-new-year"] },
  },
};

export const PROFILE_CLAIMS = Object.fromEntries(FULL_PROFILE_IDS.map((personId) => {
  const profile = PROFILES[personId];
  const support = CLAIM_SUPPORT[personId];
  return [personId, profileClaimInventorySchema.parse({
    personId,
    companyId: COMPANY_IDS[personId],
    claims: displayedPaths(profile).map((displayPath) => {
      const mapping = support[displayPath];
      if (!mapping) {
        throw new Error(`Missing claim support for ${personId}:${displayPath}`);
      }
      return {
        displayPath,
        evidenceIds: mapping.evidenceIds,
        timelineIds: mapping.timelineIds ?? [],
      };
    }),
  })];
})) as Record<FullProfileId, ProfileClaimInventory>;

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
  changedAttendance: {
    id: "edge-changed",
    fictionalLabel: "Fictional demo scenario",
    personId: "edge-changed",
    companyId: "fictional-changed-co",
    attendanceFrom: "likely" as AttendanceConfidence,
    attendanceTo: "confirmed" as AttendanceConfidence,
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
      { id: "edge-stalled-enc-1", personId: "edge-stalled-person", companyId: "fictional-co", conferenceId: "edge-event-1", kind: "actual_encounter", occurredAt: "2025-01-10T10:00:00.000Z", summary: "Introductory conversation; no agreed next step.", company: "FictionalCo", role: "Finance Director" },
      { id: "edge-stalled-enc-2", personId: "edge-stalled-person", companyId: "fictional-co", conferenceId: "edge-event-2", kind: "actual_encounter", occurredAt: "2025-04-15T10:00:00.000Z", summary: "Brief catch-up; no reply or progression followed.", company: "FictionalCo", role: "Finance Director" },
      { id: "edge-stalled-enc-3", personId: "edge-stalled-person", companyId: "fictional-co", conferenceId: "edge-event-3", kind: "actual_encounter", occurredAt: "2025-08-01T10:00:00.000Z", summary: "Third conversation; no reciprocal next step.", company: "FictionalCo", role: "Finance Director" },
    ] satisfies TimelineEntry[],
  },
};

export const EDGE_EVIDENCE: EvidenceRecord[] = [
  fictionalEvidence("edge-cancelled-listed", "edge-cancelled", "fictional-cancelled-co", "The fictional speaker is listed on the current agenda.", null, "Edge fixture exhibit", "verified", "2026-05-20"),
  fictionalEvidence("edge-cancelled-removed", "edge-cancelled", "fictional-cancelled-co", "The fictional speaker listing was removed from the current agenda.", null, "Edge fixture exhibit", "verified", "2026-05-27"),
  fictionalEvidence("edge-open-deal-evidence", "edge-open-deal", "fictional-open-deal-co", "The fictional CRM account has an open deal owned by another rep.", null, "Edge fixture exhibit", "verified", null),
  fictionalEvidence("edge-returner-evidence", "edge-returner", "fictional-returner-co", "The person attended two prior fictional editions, but current attendance is unconfirmed.", null, "Edge fixture exhibit", "inferred", null),
  fictionalEvidence("edge-company-only-evidence", null, "meridian-remit", "The fictional company announced attendance without naming an individual.", null, "Edge fixture exhibit", "cited", "2026-08-18"),
  fictionalEvidence("edge-changed-likely", "edge-changed", "fictional-changed-co", "A compact fixture is likely attending from a side-event RSVP.", null, "Edge fixture exhibit", "cited", "2026-05-20"),
  fictionalEvidence("edge-changed-confirmed", "edge-changed", "fictional-changed-co", "A later compact fixture announcement confirms attendance.", "Amsterdam confirmed — see you at Money20/20.", "Edge fixture exhibit", "verified", "2026-05-26"),
];

export const ALL_EVIDENCE: EvidenceRecord[] = [
  ...Object.values(ALL_PROFILES).flatMap((profile) => profile.evidence),
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
    { id: "money-edge-changed", personId: "edge-changed", companyId: "fictional-changed-co", attendanceConfidence: "likely", companyTier: "B", roleFit: "influencer", crmState: "not_present", prepStatus: "to_contact", evidenceIds: ["edge-changed-likely"], currentEdition: true, cancelled: false },
    { id: "money-edge-cancelled", personId: "edge-cancelled", companyId: "fictional-cancelled-co", attendanceConfidence: "confirmed", companyTier: "B", roleFit: "other", crmState: "unknown", prepStatus: "to_contact", evidenceIds: ["edge-cancelled-listed"], currentEdition: true, cancelled: false },
  ],
});

const moneySnapshot2 = prepSnapshotSchema.parse({
  id: "money20-eu-demo-snapshot-2",
  conferenceId: "money20-eu-demo",
  researchedAt: "2026-05-27T08:40:00.000Z",
  simulatedAt: null,
  records: [
    moneySnapshot1.records[0],
    moneySnapshot1.records[1],
    moneySnapshot1.records[2],
    moneySnapshot1.records[3],
    { ...moneySnapshot1.records[4], attendanceConfidence: "confirmed", evidenceIds: ["edge-changed-likely", "edge-changed-confirmed"] },
    { ...moneySnapshot1.records[5], attendanceConfidence: "unknown", prepStatus: "not_now", evidenceIds: ["edge-cancelled-listed", "edge-cancelled-removed"], currentEdition: false, cancelled: true },
    { id: "money-company-only", personId: null, companyId: "meridian-remit", attendanceConfidence: "likely", companyTier: "A", roleFit: "unknown", crmState: "not_present", prepStatus: "to_contact", evidenceIds: ["edge-company-only-evidence"], currentEdition: true, cancelled: false },
  ],
});

const euroFinanceSnapshot = prepSnapshotSchema.parse({
  id: "eurofinance-demo-snapshot-1",
  conferenceId: "eurofinance-2026",
  researchedAt: "2026-09-02T07:30:00.000Z",
  simulatedAt: null,
  records: [
    { id: "euro-emma", personId: "emma", companyId: "atlaspay-europe", attendanceConfidence: "confirmed", companyTier: "A", roleFit: "decision_maker", crmState: "not_present", prepStatus: "to_contact", evidenceIds: ["emma-attendance", "emma-role"], currentEdition: true, cancelled: false },
    { id: "euro-liam", personId: "liam", companyId: "meridian-commerce-group", attendanceConfidence: "likely", companyTier: "A", roleFit: "decision_maker", crmState: "not_present", prepStatus: "to_contact", evidenceIds: ["liam-attendance", "liam-role"], currentEdition: true, cancelled: false },
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
