import { appendScoreSnapshot } from "@/features/conferences/scoring";
import { resolveIdentity } from "@/features/relationships/identity";
import type { FieldListEntry, TimelineEntry, WorkspaceAction, WorkspaceStateV1 } from "@/domain/types";

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
    case "score/record-snapshot": {
      const scoreSnapshots = appendScoreSnapshot(state.scoreSnapshots, action.score);
      if (scoreSnapshots === state.scoreSnapshots) return state;
      return { ...state, scoreSnapshots };
    }
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
    case "capture/draft":
      return {
        ...state,
        captureDrafts: { ...state.captureDrafts, [action.id]: action.draft },
      };
    case "copilot/store":
      return {
        ...state,
        copilotBriefs: { ...state.copilotBriefs, [action.personId]: action.stored },
      };
    case "crm/record":
      return {
        ...state,
        crmSimulations: { ...state.crmSimulations, [action.record.idempotencyKey]: action.record },
      };
    case "capture/save": {
      if (
        action.plannedMeetingId &&
        state.timeline.some(
          (entry) =>
            entry.kind === "actual_encounter" &&
            entry.plannedMeetingId === action.plannedMeetingId,
        )
      ) {
        return state;
      }

      const identity = resolveIdentity(
        {
          name: action.name,
          company: action.company,
          email: action.email,
          linkedIn: action.linkedIn,
        },
        state.contacts.map((contact) => ({
          id: contact.id,
          name: contact.name,
          company: contact.company,
          domain: contact.domain,
          email: contact.email,
          linkedIn: contact.linkedIn,
        })),
      );

      const contactId =
        identity.kind === "exact"
          ? identity.contactId
          : `captured-${action.occurredAt}-${action.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
      const contacts =
        identity.kind === "exact"
          ? state.contacts.map((contact) =>
              contact.id === contactId
                ? { ...contact, company: action.company, role: action.role || contact.role }
                : contact,
            )
          : [
              ...state.contacts,
              {
                id: contactId,
                name: action.name,
                company: action.company,
                role: action.role,
                email: action.email
                  ? { value: action.email, confidence: "verified" as const }
                  : undefined,
                linkedIn: action.linkedIn
                  ? { value: action.linkedIn, confidence: "verified" as const }
                  : undefined,
              },
            ];

      const encounter: TimelineEntry = {
        id: action.plannedMeetingId
          ? `enc-${action.plannedMeetingId}`
          : `enc-${contactId}-${action.occurredAt}`,
        personId: contactId,
        companyId: action.company.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        conferenceId: action.conferenceId,
        kind: "actual_encounter",
        occurredAt: action.occurredAt,
        summary: action.note,
        company: action.company,
        role: action.role,
        plannedMeetingId: action.plannedMeetingId,
        nextStep: action.nextStep,
        reciprocal: action.reciprocal,
      };

      const matchReviews =
        identity.kind === "review"
          ? [
              ...state.matchReviews,
              {
                id: `review-${contactId}`,
                capturedContactId: contactId,
                candidateIds: identity.candidateIds,
                status: "pending" as const,
              },
            ]
          : state.matchReviews;

      return {
        ...state,
        contacts,
        matchReviews,
        timeline: [...state.timeline, encounter],
        plannedMeetings: action.plannedMeetingId
          ? state.plannedMeetings.map((meeting) =>
              meeting.id === action.plannedMeetingId ? { ...meeting, outcome: "met" } : meeting,
            )
          : state.plannedMeetings,
      };
    }
    case "match/accept": {
      const review = state.matchReviews.find((item) => item.id === action.reviewId);
      if (!review || review.status !== "pending") return state;
      return {
        ...state,
        matchReviews: state.matchReviews.map((item) =>
          item.id === action.reviewId ? { ...item, status: "accepted" } : item,
        ),
        timeline: state.timeline.map((entry) =>
          entry.personId === review.capturedContactId
            ? { ...entry, personId: action.contactId }
            : entry,
        ),
        contacts: state.contacts.filter((contact) => contact.id !== review.capturedContactId),
      };
    }
    case "match/reject":
      return {
        ...state,
        matchReviews: state.matchReviews.map((item) =>
          item.id === action.reviewId ? { ...item, status: "rejected" } : item,
        ),
      };
    case "workspace/replace":
    case "workspace/reset":
      return action.state;
  }
}
