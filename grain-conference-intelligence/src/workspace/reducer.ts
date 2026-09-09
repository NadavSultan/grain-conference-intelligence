import { appendScoreSnapshot } from "@/features/conferences/scoring";
import type { FieldListEntry, WorkspaceAction, WorkspaceStateV1 } from "@/domain/types";

export function workspaceReducer(
  state: WorkspaceStateV1,
  action: WorkspaceAction,
): WorkspaceStateV1 {
  switch (action.type) {
    case "field/add": {
      const id = `${action.conferenceId}:${action.personId}`;
      if (state.fieldList.some((entry) => entry.id === id)) return state;

      const entry: FieldListEntry = {
        id,
        conferenceId: action.conferenceId,
        personId: action.personId,
        addedAt: new Date().toISOString(),
      };
      return { ...state, fieldList: [...state.fieldList, entry] };
    }
    case "meeting/outcome":
      return {
        ...state,
        plannedMeetings: state.plannedMeetings.map((meeting) =>
          meeting.id === action.plannedMeetingId
            ? { ...meeting, outcome: action.outcome }
            : meeting,
        ),
      };
    case "plan/set-decision": {
      const current = state.conferencePlans[action.conferenceId] ?? {
        decision: "undecided" as const,
        owner: null,
      };
      return {
        ...state,
        conferencePlans: {
          ...state.conferencePlans,
          [action.conferenceId]: { ...current, decision: action.decision },
        },
      };
    }
    case "plan/set-owner": {
      const current = state.conferencePlans[action.conferenceId] ?? {
        decision: "undecided" as const,
        owner: null,
      };
      return {
        ...state,
        conferencePlans: {
          ...state.conferencePlans,
          [action.conferenceId]: { ...current, owner: action.owner },
        },
      };
    }
    case "score/record-snapshot":
      return {
        ...state,
        scoreSnapshots: appendScoreSnapshot(state.scoreSnapshots, action.score),
      };
    case "prep/set-status": {
      const key = `${action.conferenceId}:${action.personId}`;
      return {
        ...state,
        prepStatuses: { ...state.prepStatuses, [key]: action.status },
      };
    }
    case "prep/acknowledge-coordination": {
      const key = `${action.conferenceId}:${action.personId}`;
      return {
        ...state,
        coordinationAcknowledgements: {
          ...state.coordinationAcknowledgements,
          [key]: action.acknowledgedAt,
        },
      };
    }
    case "prep/activate-snapshot": {
      if (state.activeSnapshotIds[action.conferenceId] === action.snapshotId) {
        return state;
      }
      return {
        ...state,
        activeSnapshotIds: {
          ...state.activeSnapshotIds,
          [action.conferenceId]: action.snapshotId,
        },
        simulatedResearchRuns: {
          ...state.simulatedResearchRuns,
          [action.conferenceId]: action.simulatedAt,
        },
      };
    }
    case "draft/update": {
      const current = state.outreachDrafts[action.key] ?? {};
      const next =
        action.channel === "email"
          ? { ...current, email: { subject: action.subject, body: action.body } }
          : { ...current, linkedin: { body: action.body } };
      return {
        ...state,
        outreachDrafts: { ...state.outreachDrafts, [action.key]: next },
      };
    }
    case "workspace/replace":
    case "workspace/reset":
      return action.state;
  }
}
