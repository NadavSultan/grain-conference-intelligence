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
export type ConferenceTier = "A" | "B" | "C";
export type PlanDecision = "attend" | "watch" | "skip" | "undecided";
export type ComponentScoreStatus = "sourced" | "unknown";
export type ResearchedRoomStatus = "unknown" | "researched";

export type ScoreComponent =
  | "vertical_fit"
  | "buyer_role_density"
  | "fx_relevance"
  | "meeting_accessibility"
  | "trip_efficiency";

export interface ConferenceScoreEvidence {
  id: string;
  component: ScoreComponent;
  claim: string;
  sourceUrl: string;
  verifiedAt: string;
  tag: EvidenceTag;
}

export interface ConferenceRecord {
  id: string;
  name: string;
  edition: string;
  startDate: string;
  endDate: string;
  location: string;
  geography: "Europe" | "North America" | "Middle East" | "Asia Pacific";
  vertical: "fintech" | "treasury" | "travel" | "saas";
  sourceUrl: string;
  verifiedAt: string;
  audienceSize: number | null;
  audienceSizeSource: string | null;
  scoreEvidence: ConferenceScoreEvidence[];
  demoScenarioId?: string;
  demoDateWarning?: string;
}

export interface EvidenceRecord {
  id: string;
  personId: string | null;
  companyId: string;
  edition: string;
  claim: string;
  quote: string | null;
  exhibitUrl: string;
  platform: string;
  publishedAt: string | null;
  discoveredAt: string;
  tag: EvidenceTag;
  origin: EvidenceOrigin;
}

export interface ProfileClaimReference {
  displayPath: string;
  evidenceIds: string[];
  timelineIds: string[];
}

export interface ProfileClaimInventory {
  personId: string;
  companyId: string;
  claims: ProfileClaimReference[];
}

export interface PrepSnapshotRecord {
  id: string;
  personId: string | null;
  companyId: string;
  attendanceConfidence: AttendanceConfidence;
  companyTier: CompanyTier;
  roleFit: RoleFit;
  crmState: CrmState;
  prepStatus: PrepStatus;
  evidenceIds: string[];
  currentEdition: boolean;
  cancelled: boolean;
}

export interface PrepSnapshot {
  id: string;
  conferenceId: string;
  researchedAt: string;
  simulatedAt: string | null;
  records: PrepSnapshotRecord[];
}

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
  companyId: string;
  conferenceId: string;
  kind: TimelineKind;
  occurredAt: string;
  summary: string;
  company: string;
  role: string;
  plannedMeetingId?: string;
}

export interface ScoreComponentResult {
  component: ScoreComponent;
  points: number;
  max: number;
  status: ComponentScoreStatus;
  rationale: string;
  sourceUrl: string;
  verifiedAt: string;
}

export interface ConferenceScoreResult {
  conferenceId: string;
  snapshotId: string | null;
  scoredAt: string;
  researchedAt: string | null;
  q: number | null;
  researchedRoomPoints: number;
  researchedRoomStatus: ResearchedRoomStatus;
  coverageWarning: string | null;
  components: ScoreComponentResult[];
  total: number;
  tier: ConferenceTier;
}

export interface ConferencePlan {
  decision: PlanDecision;
  owner: string | null;
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
  conferencePlans: Record<string, ConferencePlan>;
  scoreSnapshots: ConferenceScoreResult[];
}

export type WorkspaceAction =
  | { type: "field/add"; conferenceId: string; personId: string }
  | {
      type: "meeting/outcome";
      plannedMeetingId: string;
      outcome: "met" | "did_not_meet";
    }
  | {
      type: "plan/set-decision";
      conferenceId: string;
      decision: PlanDecision;
    }
  | { type: "plan/set-owner"; conferenceId: string; owner: string | null }
  | { type: "score/record-snapshot"; score: ConferenceScoreResult }
  | { type: "workspace/replace"; state: WorkspaceStateV1 }
  | { type: "workspace/reset"; state: WorkspaceStateV1 };
