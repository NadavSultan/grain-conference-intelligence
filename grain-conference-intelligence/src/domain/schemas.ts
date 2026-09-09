import { z } from "zod";

export const evidenceOriginSchema = z.enum([
  "real_public",
  "fictional_demo",
  "internal_demo",
]);
export const evidenceTagSchema = z.enum([
  "verified",
  "cited",
  "inferred",
  "unknown",
]);

export const conferenceScoreEvidenceSchema = z.object({
  id: z.string().min(1),
  component: z.enum([
    "vertical_fit",
    "buyer_role_density",
    "fx_relevance",
    "meeting_accessibility",
    "trip_efficiency",
  ]),
  claim: z.string().min(1),
  sourceUrl: z.url(),
  verifiedAt: z.string().min(1),
  tag: evidenceTagSchema,
});

export const conferenceRecordSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  edition: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  location: z.string().min(1),
  geography: z.enum(["Europe", "North America", "Middle East", "Asia Pacific"]),
  vertical: z.enum(["fintech", "treasury", "travel", "saas"]),
  sourceUrl: z.url(),
  verifiedAt: z.string().min(1),
  audienceSize: z.number().int().positive().nullable(),
  audienceSizeSource: z.url().nullable(),
  scoreEvidence: z.array(conferenceScoreEvidenceSchema).length(5),
  demoScenarioId: z.string().optional(),
  demoDateWarning: z.string().optional(),
});

export const evidenceRecordSchema = z.object({
  id: z.string().min(1),
  personId: z.string().nullable(),
  companyId: z.string().min(1),
  edition: z.string().min(1),
  claim: z.string().min(1),
  quote: z.string().nullable(),
  exhibitUrl: z.string().startsWith("/evidence/"),
  platform: z.string().min(1),
  publishedAt: z.string().nullable(),
  discoveredAt: z.string().min(1),
  tag: evidenceTagSchema,
  origin: evidenceOriginSchema,
});

export const profileClaimInventorySchema = z.object({
  personId: z.string().min(1),
  companyId: z.string().min(1),
  claims: z.array(z.object({
    displayPath: z.string().min(1),
    evidenceIds: z.array(z.string().min(1)),
    timelineIds: z.array(z.string().min(1)),
  }).refine((claim) => claim.evidenceIds.length + claim.timelineIds.length > 0, {
    message: "Every displayed claim needs evidence or timeline provenance",
  })).min(1),
});

export const prepSnapshotSchema = z.object({
  id: z.string().min(1),
  conferenceId: z.string().min(1),
  researchedAt: z.string().min(1),
  simulatedAt: z.string().nullable(),
  records: z.array(
    z.object({
      id: z.string().min(1),
      personId: z.string().nullable(),
      companyId: z.string().min(1),
      attendanceConfidence: z.enum([
        "confirmed",
        "likely",
        "probable_returner",
        "inferred",
        "unknown",
      ]),
      companyTier: z.enum(["A", "B", "C", "excluded", "unknown"]),
      roleFit: z.enum(["decision_maker", "influencer", "other", "unknown"]),
      crmState: z.enum([
        "not_present",
        "owned_by_me",
        "owned_by_other",
        "open_deal",
        "unknown",
      ]),
      prepStatus: z.enum([
        "to_contact",
        "contacted",
        "replied",
        "meeting_booked",
        "not_now",
      ]),
      evidenceIds: z.array(z.string().min(1)),
      currentEdition: z.boolean(),
      cancelled: z.boolean(),
    }),
  ),
});

export const timelineEntrySchema = z.object({
  id: z.string().min(1),
  personId: z.string().min(1),
  companyId: z.string().min(1),
  conferenceId: z.string().min(1),
  kind: z.enum([
    "research_observation",
    "outreach_sent",
    "reply",
    "planned_meeting",
    "actual_encounter",
  ]),
  occurredAt: z.string().min(1),
  summary: z.string(),
  company: z.string(),
  role: z.string(),
  plannedMeetingId: z.string().optional(),
  nextStep: z.string().optional(),
  reciprocal: z.boolean().optional(),
});

export const conferenceScoreResultSchema = z.object({
  conferenceId: z.string().min(1),
  snapshotId: z.string().min(1).nullable(),
  scoredAt: z.string().min(1),
  researchedAt: z.string().min(1).nullable(),
  q: z.number().int().nonnegative().nullable(),
  researchedRoomPoints: z.number().int().nonnegative(),
  researchedRoomStatus: z.enum(["unknown", "researched"]),
  coverageWarning: z.string().min(1).nullable(),
  components: z.array(
    z.object({
      component: z.enum([
        "vertical_fit",
        "buyer_role_density",
        "fx_relevance",
        "meeting_accessibility",
        "trip_efficiency",
      ]),
      points: z.number().int().nonnegative(),
      max: z.number().int().positive(),
      status: z.enum(["sourced", "unknown"]),
      rationale: z.string().min(1),
      sourceUrl: z.string().min(1),
      verifiedAt: z.string().min(1),
    }),
  ),
  total: z.number().int().nonnegative(),
  tier: z.enum(["A", "B", "C"]),
});

export const relationshipBriefSchema = z.object({
  state: z.enum(["warming", "stalled", "unclear"]),
  confidence: z.number().min(0).max(1),
  summary: z.string().min(1),
  evidenceEncounterIds: z.array(z.string()),
  evidenceSignalIds: z.array(z.string()),
  suggestedAngle: z.object({
    fact: z.string().min(1),
    evidenceIds: z.array(z.string()),
    relevanceInference: z.string().min(1),
  }),
  counterEvidence: z.array(z.string()),
  recommendedAction: z.string().min(1),
  followUpDraft: z.object({ subject: z.string(), body: z.string() }).nullable(),
  linkedInDraft: z.string().nullable(),
});

export const conferencePlanSchema = z.object({
  decision: z.enum(["attend", "watch", "skip", "undecided"]),
  owner: z.string().min(1).nullable(),
});

export const workspaceStateV1Schema = z.object({
  version: z.literal(1),
  workspaceId: z.string().min(1),
  createdAt: z.string().min(1),
  fieldList: z.array(
    z.object({
      id: z.string().min(1),
      conferenceId: z.string().min(1),
      personId: z.string().min(1),
      addedAt: z.string().min(1),
    }),
  ),
  plannedMeetings: z.array(
    z.object({
      id: z.string().min(1),
      conferenceId: z.string().min(1),
      personId: z.string().min(1),
      scheduledFor: z.string().min(1),
      context: z.string(),
      outcome: z.enum(["planned", "met", "did_not_meet"]),
    }),
  ),
  timeline: z.array(timelineEntrySchema),
  prepStatuses: z.record(
    z.string(),
    z.enum(["to_contact", "contacted", "replied", "meeting_booked", "not_now"]),
  ),
  coordinationAcknowledgements: z.record(z.string(), z.string()),
  activeSnapshotIds: z.record(z.string(), z.string()),
  simulatedResearchRuns: z.record(z.string(), z.string()),
  conferencePlans: z.record(z.string(), conferencePlanSchema),
  scoreSnapshots: z.array(conferenceScoreResultSchema),
  outreachDrafts: z.record(
    z.string(),
    z.object({
      email: z.object({ subject: z.string().nullable().optional(), body: z.string() }).optional(),
      linkedin: z.object({ body: z.string() }).optional(),
    }),
  ),
  contacts: z.array(
    z.object({
      id: z.string().min(1),
      name: z.string().min(1),
      company: z.string().min(1),
      role: z.string(),
      domain: z.string().optional(),
      email: z.object({ value: z.string(), confidence: z.enum(["verified", "inferred"]) }).optional(),
      linkedIn: z.object({ value: z.string(), confidence: z.literal("verified") }).optional(),
    }),
  ),
  matchReviews: z.array(
    z.object({
      id: z.string().min(1),
      capturedContactId: z.string().min(1),
      candidateIds: z.array(z.string()),
      status: z.enum(["pending", "accepted", "rejected"]),
    }),
  ),
  captureDrafts: z.record(
    z.string(),
    z.object({
      name: z.string(),
      company: z.string(),
      conferenceId: z.string(),
      occurredAt: z.string(),
      note: z.string(),
      role: z.string(),
      email: z.string(),
      linkedIn: z.string(),
      nextStep: z.string(),
      plannedMeetingId: z.string().optional(),
    }),
  ),
  copilotBriefs: z
    .record(
      z.string(),
      z.object({
        personId: z.string().min(1),
        mode: z.enum(["live", "fallback", "cached"]),
        provider: z.string(),
        model: z.string(),
        generatedAt: z.string().min(1),
        brief: relationshipBriefSchema,
      }),
    )
    .default({}),
  crmSimulations: z
    .record(
      z.string(),
      z.object({
        idempotencyKey: z.string().min(1),
        contactStep: z.object({
          status: z.enum(["created", "reused", "failed", "blocked"]),
          id: z.string().nullable(),
          reason: z.string().optional(),
        }),
        noteStep: z.object({
          status: z.enum(["created", "reused", "failed", "blocked"]),
          id: z.string().nullable(),
          reason: z.string().optional(),
        }),
      }),
    )
    .default({}),
});
