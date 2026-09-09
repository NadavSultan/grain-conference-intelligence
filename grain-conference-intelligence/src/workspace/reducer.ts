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
    case "workspace/replace":
    case "workspace/reset":
      return action.state;
  }
}
