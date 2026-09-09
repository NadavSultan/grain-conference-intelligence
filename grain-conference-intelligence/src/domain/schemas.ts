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

export const timelineEntrySchema = z.object({
  id: z.string().min(1),
  personId: z.string().min(1),
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
