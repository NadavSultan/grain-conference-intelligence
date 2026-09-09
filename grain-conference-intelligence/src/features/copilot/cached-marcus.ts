import type { RelationshipBrief } from "@/domain/types";

export const CACHED_MARCUS_BRIEF: RelationshipBrief = {
  state: "unclear",
  confidence: 0.38,
  summary:
    "Cached credential-free example: Marcus has one actual prior meeting (enc-marcus-money20-prior). Unanswered follow-up and a public like do not establish warming.",
  evidenceEncounterIds: ["enc-marcus-money20-prior"],
  evidenceSignalIds: ["marcus-speaker-current", "marcus-warming-hypothesis"],
  suggestedAngle: {
    fact: "Marcus is listed for a fictional current-edition fireside chat.",
    evidenceIds: ["marcus-speaker-current"],
    relevanceInference: "The listing is useful context for a qualification question, not proof of buying progression.",
  },
  counterEvidence: [
    "Unanswered or delayed outbound follow-up is not buying progression.",
    "Public activity is context, not a meeting or reciprocal commitment.",
  ],
  recommendedAction: "Ask whether new corridors changed how Payloom handles emerging-market FX?",
  followUpDraft: {
    subject: "Picking up from last year's Money20/20",
    body: "Has the FX process for the newer corridors changed since we spoke last June?",
  },
  linkedInDraft: "Saw the fireside listing — still the right person on emerging-market FX?",
};
