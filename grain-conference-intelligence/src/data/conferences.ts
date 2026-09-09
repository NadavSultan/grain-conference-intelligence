import { conferenceRecordSchema } from "@/domain/schemas";
import type {
  ConferenceRecord,
  ConferenceScoreEvidence,
  EvidenceTag,
  ScoreComponent,
} from "@/domain/types";

const VERIFIED_AT = "2026-09-09";
const COMPONENTS: ScoreComponent[] = [
  "vertical_fit",
  "buyer_role_density",
  "fx_relevance",
  "meeting_accessibility",
  "trip_efficiency",
];

type Claims = Record<
  ScoreComponent,
  { claim: string; sourceUrl: string; tag?: EvidenceTag }
>;

function evidence(
  conferenceId: string,
  claims: Claims,
): ConferenceScoreEvidence[] {
  return COMPONENTS.map((component) => ({
    id: `${conferenceId}:${component}`,
    component,
    claim: claims[component].claim,
    sourceUrl: claims[component].sourceUrl,
    verifiedAt: VERIFIED_AT,
    tag: claims[component].tag ?? "verified",
  }));
}

function defineConference(
  record: Omit<ConferenceRecord, "verifiedAt" | "scoreEvidence"> & { claims: Claims },
): ConferenceRecord {
  const { claims, ...conference } = record;
  return conferenceRecordSchema.parse({
    ...conference,
    verifiedAt: VERIFIED_AT,
    scoreEvidence: evidence(conference.id, claims),
  });
}

const unknownTrip = (location: string, sourceUrl: string) => ({
  claim: `${location} is verified. The reviewed organizer page does not support a same-city companion-event claim, so trip efficiency remains Unknown.`,
  sourceUrl,
  tag: "unknown" as const,
});

export const CONFERENCES: ConferenceRecord[] = [
  defineConference({
    id: "money20-europe-2027",
    name: "Money20/20 Europe",
    edition: "2027",
    startDate: "2027-06-08",
    endDate: "2027-06-10",
    location: "The RAI, Amsterdam, Netherlands",
    geography: "Europe",
    vertical: "fintech",
    sourceUrl: "https://europe.money2020.com/attend",
    audienceSize: 7400,
    audienceSizeSource: "https://europe.money2020.com/attend",
    demoScenarioId: "money20-eu-demo",
    demoDateWarning:
      "The fictional outreach pages use an illustrative 2–4 June scenario; review every illustrative date before real outreach.",
    claims: {
      vertical_fit: { claim: "The organizer describes a fintech audience spanning banks, payments, technology, startups, retail, policy, crypto, and cybersecurity.", sourceUrl: "https://europe.money2020.com/attend" },
      buyer_role_density: { claim: "The 2027 attendance page reports 7,400+ attendees and one in three at C-suite level.", sourceUrl: "https://europe.money2020.com/attend" },
      fx_relevance: { claim: "The official landing page features a Money20/20 and FXC Intelligence cross-border payments report.", sourceUrl: "https://europe.money2020.com/" },
      meeting_accessibility: { claim: "The organizer says the event supports meetings with potential clients and partners and includes networking opportunities.", sourceUrl: "https://europe.money2020.com/attend" },
      trip_efficiency: unknownTrip("The RAI in Amsterdam", "https://europe.money2020.com/attend"),
    },
  }),
  defineConference({
    id: "money20-usa-2026",
    name: "Money20/20 USA",
    edition: "2026",
    startDate: "2026-10-18",
    endDate: "2026-10-21",
    location: "The Venetian, Las Vegas, Nevada, USA",
    geography: "North America",
    vertical: "fintech",
    sourceUrl: "https://us.money2020.com/attend/faq",
    audienceSize: 11000,
    audienceSizeSource: "https://us.money2020.com/attend/faq",
    claims: {
      vertical_fit: { claim: "The official page names banks, payments, fintech, retail, technology, and investment leaders as its audience.", sourceUrl: "https://us.money2020.com/" },
      buyer_role_density: { claim: "The organizer reports 11,000+ senior attendees and one in three C-suite attendees.", sourceUrl: "https://us.money2020.com/" },
      fx_relevance: { claim: "Payments are an explicit official agenda theme.", sourceUrl: "https://us.money2020.com/" },
      meeting_accessibility: { claim: "The official pass page documents a networking app, agenda builder, searchable attendee list, and meeting concierge.", sourceUrl: "https://us.money2020.com/platinum-pass" },
      trip_efficiency: unknownTrip("The Venetian in Las Vegas", "https://us.money2020.com/attend/faq"),
    },
  }),
  defineConference({
    id: "money20-middle-east-2026",
    name: "Money20/20 Middle East",
    edition: "2026",
    startDate: "2026-09-14",
    endDate: "2026-09-16",
    location: "Riyadh Exhibition & Convention Center, Malham, Saudi Arabia",
    geography: "Middle East",
    vertical: "fintech",
    sourceUrl: "https://money2020middleeast.com/about-us/key-information",
    audienceSize: 38000,
    audienceSizeSource: "https://money2020middleeast.com/tickets-2026",
    claims: {
      vertical_fit: { claim: "The organizer identifies banks, financial institutions, fintechs, payment providers, technology companies, merchants, regulators, investors, and founders as attendees.", sourceUrl: "https://money2020middleeast.com/about-us/key-information" },
      buyer_role_density: { claim: "The official information page lists enterprise executives among the audience, while the 2026 ticket page reports 38,000+ attendees.", sourceUrl: "https://money2020middleeast.com/about-us/key-information" },
      fx_relevance: { claim: "The official 2026 programme includes cross-border investment and payments corridors.", sourceUrl: "https://app.money2020middleeast.com/event/money20-20-middle-east-2026/planning/UGxhbm5pbmdfNDU2MTk5Mg%3D%3D" },
      meeting_accessibility: { claim: "The official ticket page documents AI matchmaking, a meeting concierge, lounges, and networking events.", sourceUrl: "https://money2020middleeast.com/tickets-2026" },
      trip_efficiency: unknownTrip("Riyadh Exhibition & Convention Center in Malham", "https://money2020middleeast.com/about-us/key-information"),
    },
  }),
  defineConference({
    id: "money20-asia-2027",
    name: "Money20/20 Asia",
    edition: "2027",
    startDate: "2027-04-27",
    endDate: "2027-04-29",
    location: "Queen Sirikit National Convention Center, Bangkok, Thailand",
    geography: "Asia Pacific",
    vertical: "fintech",
    sourceUrl: "https://asia.money2020.com/attend",
    audienceSize: 5000,
    audienceSizeSource: "https://asia.money2020.com/attend",
    claims: {
      vertical_fit: { claim: "The official page targets banks, payment innovators, digital-asset companies, startups, investors, and technology leaders.", sourceUrl: "https://asia.money2020.com/attend" },
      buyer_role_density: { claim: "The organizer advertises 5,000+ attendees and says one in three are C-suite.", sourceUrl: "https://asia.money2020.com/attend" },
      fx_relevance: { claim: "The official page explicitly highlights cross-border growth, payments, banking, and financial infrastructure.", sourceUrl: "https://asia.money2020.com/attend" },
      meeting_accessibility: { claim: "The organizer describes curated networking spaces and an AI-powered app.", sourceUrl: "https://asia.money2020.com/attend" },
      trip_efficiency: unknownTrip("Bangkok's QSNCC", "https://asia.money2020.com/attend"),
    },
  }),
  defineConference({
    id: "singapore-fintech-festival-2026",
    name: "Singapore FinTech Festival",
    edition: "2026",
    startDate: "2026-11-18",
    endDate: "2026-11-20",
    location: "Singapore EXPO, Singapore",
    geography: "Asia Pacific",
    vertical: "fintech",
    sourceUrl: "https://www.fintechfestival.sg/",
    audienceSize: null,
    audienceSizeSource: null,
    claims: {
      vertical_fit: { claim: "The organizer calls SFF an annual gathering of policy, finance, and technology.", sourceUrl: "https://www.fintechfestival.sg/" },
      buyer_role_density: { claim: "The official participation page targets senior policymakers, capital providers, and financial and technology leaders; no total is stored.", sourceUrl: "https://www.fintechfestival.sg/join-sff2026" },
      fx_relevance: { claim: "The official agenda includes a session dedicated to cross-border payments and money movement.", sourceUrl: "https://www.fintechfestival.sg/agenda?session=AGND577-one-world-many-rails-defining-the-next-chapter-of-money-movement" },
      meeting_accessibility: { claim: "The organizer describes curated participation across senior policy, capital, finance, and technology communities but does not document a meeting-booking tool on the reviewed page.", sourceUrl: "https://www.fintechfestival.sg/join-sff2026", tag: "unknown" },
      trip_efficiency: unknownTrip("Singapore EXPO", "https://www.fintechfestival.sg/"),
    },
  }),
  defineConference({
    id: "sibos-2026",
    name: "Sibos",
    edition: "2026",
    startDate: "2026-09-28",
    endDate: "2026-10-01",
    location: "Miami Beach Convention Center, Miami Beach, Florida, USA",
    geography: "North America",
    vertical: "fintech",
    sourceUrl: "https://www.sibos.com/attend/faq",
    audienceSize: null,
    audienceSizeSource: null,
    claims: {
      vertical_fit: { claim: "The organizer describes a global financial-services community spanning banking, payments, securities, technology, and policy.", sourceUrl: "https://www.sibos.com/" },
      buyer_role_density: { claim: "The conference overview describes senior leaders, policymakers, technology experts, and innovators; no current-edition attendee total is stored.", sourceUrl: "https://www.sibos.com/programme/conference-at-glance" },
      fx_relevance: { claim: "The official conference programme explicitly covers payments, securities, FX, and trade.", sourceUrl: "https://www.sibos.com/programme/conference" },
      meeting_accessibility: { claim: "The organizer positions Sibos as a networking and collaboration event for its financial-services community.", sourceUrl: "https://www.sibos.com/" },
      trip_efficiency: unknownTrip("Miami Beach Convention Center", "https://www.sibos.com/attend/faq"),
    },
  }),
  defineConference({
    id: "eurofinance-2026",
    name: "EuroFinance International Treasury Management",
    edition: "2026",
    startDate: "2026-09-16",
    endDate: "2026-09-18",
    location: "Barcelona International Convention Centre, Barcelona, Spain",
    geography: "Europe",
    vertical: "treasury",
    sourceUrl: "https://www.eurofinance.com/international-treasury-event/faq/",
    audienceSize: null,
    audienceSizeSource: null,
    claims: {
      vertical_fit: { claim: "The official registration page identifies the event as serving corporate treasury and finance professionals.", sourceUrl: "https://www.eurofinance.com/international-treasury-event/registration/" },
      buyer_role_density: { claim: "The organizer identifies corporate treasurers, CFOs, finance directors, banks, and treasury technology providers; no current-edition total is stored.", sourceUrl: "https://www.eurofinance.com/international-treasury-event/faq/" },
      fx_relevance: { claim: "The official roundtable programme includes managing corporate FX risk with automation and AI.", sourceUrl: "https://www.eurofinance.com/international-treasury-event/treasury-exchange-roundtables/" },
      meeting_accessibility: { claim: "The official networking app exposes the attendee list and supports scheduled meetings.", sourceUrl: "https://www.eurofinance.com/international-treasury-event/networking-app/" },
      trip_efficiency: unknownTrip("Barcelona's CCIB", "https://www.eurofinance.com/international-treasury-event/faq/"),
    },
  }),
  defineConference({
    id: "seamless-middle-east-2026",
    name: "Seamless Fintech Middle East",
    edition: "2026",
    startDate: "2026-09-22",
    endDate: "2026-09-24",
    location: "Dubai World Trade Centre, Dubai, United Arab Emirates",
    geography: "Middle East",
    vertical: "fintech",
    sourceUrl: "https://www.terrapinn.com/exhibition/seamless-middle-east-fintech/",
    audienceSize: 20000,
    audienceSizeSource: "https://www.terrapinn.com/exhibition/seamless-middle-east-fintech/",
    claims: {
      vertical_fit: { claim: "The official page focuses on fintech and payments across technology, government, institutions, investors, and media.", sourceUrl: "https://www.terrapinn.com/exhibition/seamless-middle-east-fintech/" },
      buyer_role_density: { claim: "The organizer publishes 20,000 attendees and describes senior and C-suite participation.", sourceUrl: "https://www.terrapinn.com/exhibition/seamless-middle-east-fintech/Event-Highlights.stm" },
      fx_relevance: { claim: "The official agenda includes cross-border payments and remittance topics.", sourceUrl: "https://www.terrapinn.com/exhibition/seamless-middle-east-fintech/Agenda.stm" },
      meeting_accessibility: { claim: "The official FAQ offers attendee viewing and meeting booking through its networking app.", sourceUrl: "https://www.terrapinn.com/exhibition/seamless-middle-east-fintech/frequently-asked-questions.stm" },
      trip_efficiency: unknownTrip("Dubai World Trade Centre", "https://www.terrapinn.com/exhibition/seamless-middle-east-fintech/"),
    },
  }),
  defineConference({
    id: "itb-berlin-2027",
    name: "ITB Berlin",
    edition: "2027",
    startDate: "2027-03-16",
    endDate: "2027-03-18",
    location: "Berlin Exhibition Grounds, Berlin, Germany",
    geography: "Europe",
    vertical: "travel",
    sourceUrl: "https://www.itb.com/en",
    audienceSize: null,
    audienceSizeSource: null,
    claims: {
      vertical_fit: { claim: "The official page positions ITB as a global travel trade show covering the tourism value chain.", sourceUrl: "https://www.itb.com/en" },
      buyer_role_density: { claim: "The travel-technology page describes access to industry decision-makers; no current-edition attendee total is stored.", sourceUrl: "https://www.itb.com/en/ausstellen/exhibition-areas/travel-technology" },
      fx_relevance: { claim: "The travel-technology exhibition area includes payment solutions, but the reviewed organizer page does not establish a dedicated FX programme.", sourceUrl: "https://www.itb.com/en/ausstellen/exhibition-areas/travel-technology", tag: "unknown" },
      meeting_accessibility: { claim: "The official Navigator supports exhibitor discovery, appointments, and networking.", sourceUrl: "https://www.itb.com/en/itb-berlin-for-visitors/exhibiton-planning/itb-navigator" },
      trip_efficiency: unknownTrip("Berlin Exhibition Grounds", "https://www.itb.com/en"),
    },
  }),
  defineConference({
    id: "saastr-ai-annual-2027",
    name: "SaaStr AI Annual",
    edition: "2027",
    startDate: "2027-05-11",
    endDate: "2027-05-12",
    location: "San Francisco Bay Area, USA",
    geography: "North America",
    vertical: "saas",
    sourceUrl: "https://www.saastrannual.com/buy-tickets-2026",
    audienceSize: null,
    audienceSizeSource: null,
    claims: {
      vertical_fit: { claim: "The current ticket page targets B2B SaaS and AI founders, revenue leaders, executives, and investors.", sourceUrl: "https://www.saastrannual.com/buy-tickets-2026" },
      buyer_role_density: { claim: "The current ticket page identifies founders, revenue leaders, executives, and investors, but does not support the previously stored 12,500 figure; audience size remains Unknown.", sourceUrl: "https://www.saastrannual.com/buy-tickets-2026", tag: "unknown" },
      fx_relevance: { claim: "The reviewed organizer page does not assert a dedicated FX or cross-border treasury programme.", sourceUrl: "https://www.saastrannual.com/buy-tickets-2026", tag: "unknown" },
      meeting_accessibility: { claim: "The current ticket page advertises structured one-to-one meetings and roundtables.", sourceUrl: "https://www.saastrannual.com/buy-tickets-2026" },
      trip_efficiency: unknownTrip("the San Francisco Bay Area", "https://www.saastrannual.com/buy-tickets-2026"),
    },
  }),
  defineConference({
    id: "business-travel-show-europe-2027",
    name: "Business Travel Show Europe",
    edition: "2027",
    startDate: "2027-06-23",
    endDate: "2027-06-24",
    location: "ExCeL London, London, United Kingdom",
    geography: "Europe",
    vertical: "travel",
    sourceUrl: "https://www.businesstravelshoweurope.com/hosted/hosted-buyer-faqs",
    audienceSize: null,
    audienceSizeSource: null,
    claims: {
      vertical_fit: { claim: "The official show serves corporate travel managers, meeting planners, and procurement professionals.", sourceUrl: "https://www.businesstravelshoweurope.com/" },
      buyer_role_density: { claim: "The official hosted-buyer criteria require travel-budget or policy decision authority; no total is stored.", sourceUrl: "https://www.businesstravelshoweurope.com/hosted/hosted-buyer-faqs" },
      fx_relevance: { claim: "Corporate travel is verified, but the reviewed organizer page does not establish a dedicated FX programme.", sourceUrl: "https://www.businesstravelshoweurope.com/", tag: "unknown" },
      meeting_accessibility: { claim: "The official hosted-buyer programme uses pre-scheduled appointments and networking events.", sourceUrl: "https://www.businesstravelshoweurope.com/hosted/hosted-buyer-faqs" },
      trip_efficiency: { claim: "The organizer confirms co-location with TravelTech Show at ExCeL London.", sourceUrl: "https://traveltech-show.com/visit/co-located-shows" },
    },
  }),
  defineConference({
    id: "traveltech-show-2027",
    name: "TravelTech Show",
    edition: "2027",
    startDate: "2027-06-23",
    endDate: "2027-06-24",
    location: "ExCeL London, London, United Kingdom",
    geography: "Europe",
    vertical: "travel",
    sourceUrl: "https://traveltech-show.com/",
    audienceSize: null,
    audienceSizeSource: null,
    claims: {
      vertical_fit: { claim: "The official show describes a travel-technology marketplace for TMCs, tour operators, OTAs, airlines, and hotels.", sourceUrl: "https://traveltech-show.com/" },
      buyer_role_density: { claim: "The organizer describes access to decision-makers and 700+ buyers, but this buyer count is not stored as total audience.", sourceUrl: "https://traveltech-show.com/exhibit" },
      fx_relevance: { claim: "The organizer identifies payments as part of travel technology, but the reviewed page does not establish dedicated FX programming.", sourceUrl: "https://traveltech-show.com/about-us/our-story", tag: "unknown" },
      meeting_accessibility: { claim: "The organizer describes pre-arranged one-to-one meetings.", sourceUrl: "https://traveltech-show.com/exhibit" },
      trip_efficiency: { claim: "The exhibit page confirms the show is co-located with Business Travel Show Europe at ExCeL London.", sourceUrl: "https://traveltech-show.com/exhibit" },
    },
  }),
];

export function audienceSizeLabel(conference: ConferenceRecord): string {
  return conference.audienceSize === null
    ? "Unknown"
    : new Intl.NumberFormat("en-US").format(conference.audienceSize);
}
