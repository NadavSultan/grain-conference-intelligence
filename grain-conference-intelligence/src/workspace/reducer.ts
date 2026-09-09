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
    case "workspace/replace":
    case "workspace/reset":
      return action.state;
  }
}
