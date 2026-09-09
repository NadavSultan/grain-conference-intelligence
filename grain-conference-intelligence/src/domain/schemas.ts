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
});
