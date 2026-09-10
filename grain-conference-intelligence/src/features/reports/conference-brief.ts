import { CONFERENCES } from "@/data/conferences";
import { PREP_SNAPSHOTS, PROFILES } from "@/data/prep-snapshots";
import type {
  AttendanceConfidence,
  CompanyTier,
  ConferencePlan,
  ConferenceScoreResult,
  PlannedMeeting,
  PrepStatus,
  RoleFit,
  StoredCopilotBrief,
  WorkspaceStateV1,
} from "@/domain/types";
import { getConferencePlan } from "@/features/conferences/planning";
import {
  calculateConferenceScore,
  recommendDecision,
  snapshotForConference,
} from "@/features/conferences/scoring";
import {
  buildPrepViewRecords,
  calculatePrepSummary,
  isRelevant,
  sortPrepRecords,
  type PrepSummary,
} from "@/features/prep/selectors";

export type ConferenceBriefResult =
  | { status: "not_found" }
  | { status: "ready"; report: ConferenceBriefReport };

export interface ConferenceBriefContact {
  id: string;
  personId: string | null;
  name: string;
  outreachStatus: PrepStatus;
  companyTier: CompanyTier;
  attendanceConfidence: AttendanceConfidence;
  roleFit: RoleFit;
  fictionalLabel: "Fictional demo scenario" | null;
}

export interface ConferenceBriefMeeting {
  id: string;
  personId: string;
  personName: string;
  scheduledFor: string;
  context: string;
  outcome: PlannedMeeting["outcome"];
}

export interface ConferenceBriefCopilotEntry {
  personId: string;
  personName: string;
  stored: StoredCopilotBrief | null;
}

export interface ConferenceBriefReport {
  conferenceId: string;
  name: string;
  startDate: string;
  endDate: string;
  location: string;
  sourceUrl: string;
  demoWarning: string | null;
  score: ConferenceScoreResult;
  recommendation: ReturnType<typeof recommendDecision>;
  plan: ConferencePlan;
  prep: {
    available: boolean;
    summary: PrepSummary | null;
  };
  priorityContacts: ConferenceBriefContact[];
  meetings: ConferenceBriefMeeting[];
  copilot: ConferenceBriefCopilotEntry[];
}

export function buildConferenceBrief(
  conferenceId: string,
  state: WorkspaceStateV1,
): ConferenceBriefResult {
  const conference = CONFERENCES.find((item) => item.id === conferenceId);
  if (!conference) return { status: "not_found" };

  const researchKey = conference.demoScenarioId ?? conference.id;
  const snapshot = snapshotForConference(conference, PREP_SNAPSHOTS, state.activeSnapshotIds);
  const score = calculateConferenceScore(conference, snapshot);
  const plan = getConferencePlan(state.conferencePlans, conferenceId);

  const records = snapshot
    ? buildPrepViewRecords({
        records: snapshot.records,
        researchKey,
        prepStatuses: state.prepStatuses,
        profiles: PROFILES,
      })
    : [];
  const priorityContacts = snapshot
    ? sortPrepRecords(records.filter(isRelevant)).map((record) => ({
        id: record.id,
        personId: record.personId,
        name: record.name,
        outreachStatus: record.prepStatus,
        companyTier: record.companyTier,
        attendanceConfidence: record.attendanceConfidence,
        roleFit: record.roleFit,
        fictionalLabel:
          record.personId && record.personId in PROFILES
            ? PROFILES[record.personId as keyof typeof PROFILES].fictionalLabel
            : null,
      }))
    : [];

  const conferenceKeys = new Set(
    [conference.id, conference.demoScenarioId].filter((value): value is string => Boolean(value)),
  );
  const meetings = state.plannedMeetings
    .filter((meeting) => conferenceKeys.has(meeting.conferenceId))
    .map((meeting) => ({
      id: meeting.id,
      personId: meeting.personId,
      personName: personName(meeting.personId, state),
      scheduledFor: meeting.scheduledFor,
      context: meeting.context,
      outcome: meeting.outcome,
    }));

  const copilot: ConferenceBriefCopilotEntry[] = [];
  for (const contact of priorityContacts) {
    if (!contact.personId) continue;
    copilot.push({
      personId: contact.personId,
      personName: contact.name,
      stored: state.copilotBriefs[contact.personId] ?? null,
    });
  }

  return {
    status: "ready",
    report: {
      conferenceId: conference.id,
      name: conference.name,
      startDate: conference.startDate,
      endDate: conference.endDate,
      location: conference.location,
      sourceUrl: conference.sourceUrl,
      demoWarning: conference.demoDateWarning ?? null,
      score,
      recommendation: recommendDecision(score.tier),
      plan,
      prep: snapshot
        ? { available: true, summary: calculatePrepSummary(records) }
        : { available: false, summary: null },
      priorityContacts,
      meetings,
      copilot,
    },
  };
}

function personName(personId: string, state: WorkspaceStateV1): string {
  if (personId in PROFILES) return PROFILES[personId as keyof typeof PROFILES].name;
  return state.contacts.find((contact) => contact.id === personId)?.name ?? personId;
}
