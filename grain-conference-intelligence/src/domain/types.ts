export type EvidenceOrigin = "real_public" | "fictional_demo" | "internal_demo";
export type EvidenceTag = "verified" | "cited" | "inferred" | "unknown";
export type AttendanceConfidence =
  | "confirmed"
  | "likely"
  | "probable_returner"
  | "inferred"
  | "unknown";
export type CompanyTier = "A" | "B" | "C" | "excluded" | "unknown";
export type RoleFit = "decision_maker" | "influencer" | "other" | "unknown";
export type PrepStatus =
  | "to_contact"
  | "contacted"
  | "replied"
  | "meeting_booked"
  | "not_now";
export type TimelineKind =
  | "research_observation"
  | "outreach_sent"
  | "reply"
  | "planned_meeting"
  | "actual_encounter";
export type CrmState =
  | "not_present"
  | "owned_by_me"
  | "owned_by_other"
  | "open_deal"
  | "unknown";

export interface FieldListEntry {
  id: string;
  conferenceId: string;
  personId: string;
  addedAt: string;
}

export interface PlannedMeeting {
  id: string;
  conferenceId: string;
  personId: string;
  scheduledFor: string;
  context: string;
  outcome: "planned" | "met" | "did_not_meet";
}

export interface TimelineEntry {
  id: string;
  personId: string;
  conferenceId: string;
  kind: TimelineKind;
  occurredAt: string;
  summary: string;
  company: string;
  role: string;
  plannedMeetingId?: string;
}

export interface WorkspaceStateV1 {
  version: 1;
  workspaceId: string;
  createdAt: string;
  fieldList: FieldListEntry[];
  plannedMeetings: PlannedMeeting[];
  timeline: TimelineEntry[];
  prepStatuses: Record<string, PrepStatus>;
  coordinationAcknowledgements: Record<string, string>;
  activeSnapshotIds: Record<string, string>;
  simulatedResearchRuns: Record<string, string>;
}

export type WorkspaceAction =
  | { type: "field/add"; conferenceId: string; personId: string }
  | {
      type: "meeting/outcome";
      plannedMeetingId: string;
      outcome: "met" | "did_not_meet";
    }
  | { type: "workspace/replace"; state: WorkspaceStateV1 }
  | { type: "workspace/reset"; state: WorkspaceStateV1 };
