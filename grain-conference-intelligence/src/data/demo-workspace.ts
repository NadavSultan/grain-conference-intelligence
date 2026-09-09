import { workspaceStateV1Schema } from "@/domain/schemas";
import type { WorkspaceStateV1 } from "@/domain/types";
import { FULL_PROFILE_IDS, PREP_SNAPSHOTS } from "@/data/prep-snapshots";

const DEMO_CLOCK = "2026-05-20T09:00:00.000Z";

export function createDemoWorkspace(): WorkspaceStateV1 {
  const activeSnapshotIds = Object.fromEntries(
    ["money20-eu-demo-snapshot-1", "eurofinance-demo-snapshot-1"].map((id) => {
      const snapshot = PREP_SNAPSHOTS.find((candidate) => candidate.id === id);
      if (!snapshot) {
        throw new Error(`Trusted demo snapshot is missing: ${id}`);
      }
      return [snapshot.conferenceId, snapshot.id];
    }),
  );

  return workspaceStateV1Schema.parse({
    version: 1,
    workspaceId: "grain-demo-workspace-v1",
    createdAt: DEMO_CLOCK,
    fieldList: [],
    plannedMeetings: [
      {
        id: "pm-marcus",
        conferenceId: "money20-eu-demo",
        personId: "marcus",
        scheduledFor: "2026-06-03T11:30:00.000Z",
        context: "Planned second encounter after the illustrative fireside chat.",
        outcome: "planned",
      },
    ],
    timeline: [
      {
        id: "enc-marcus-money20-prior",
        personId: "marcus",
        conferenceId: "money20-eu-prior-demo",
        kind: "actual_encounter",
        occurredAt: "2025-06-03T14:00:00.000Z",
        summary: "Good chat at the booth. Hedges majors with bank, eats the rest.",
        company: "Payloom",
        role: "Treasury Director",
      },
      {
        id: "outreach-marcus-one-pager",
        personId: "marcus",
        conferenceId: "money20-eu-prior-demo",
        kind: "outreach_sent",
        occurredAt: "2025-06-20T09:00:00.000Z",
        summary: "Follow-up email sent with a one-pager.",
        company: "Payloom",
        role: "Treasury Director",
      },
      {
        id: "reply-marcus-new-year",
        personId: "marcus",
        conferenceId: "money20-eu-prior-demo",
        kind: "reply",
        occurredAt: "2025-06-20T15:00:00.000Z",
        summary: "Thanks, will come back to you in the new year.",
        company: "Payloom",
        role: "Treasury Director",
      },
      {
        id: "outreach-marcus-second-follow-up",
        personId: "marcus",
        conferenceId: "money20-eu-prior-demo",
        kind: "outreach_sent",
        occurredAt: "2025-09-20T09:00:00.000Z",
        summary: "Second follow-up sent; no reply followed.",
        company: "Payloom",
        role: "Treasury Director",
      },
      {
        id: "observation-marcus-linkedin-like",
        personId: "marcus",
        conferenceId: "money20-eu-demo",
        kind: "research_observation",
        occurredAt: "2025-12-20T09:00:00.000Z",
        summary: "Liked a fictional Grain LinkedIn post about emerging-market corridors.",
        company: "Payloom",
        role: "Treasury Director",
      },
    ],
    prepStatuses: Object.fromEntries(
      FULL_PROFILE_IDS.map((personId) => [
        `money20-eu-demo:${personId}`,
        "to_contact",
      ]),
    ),
    coordinationAcknowledgements: {},
    activeSnapshotIds,
    simulatedResearchRuns: {},
  });
}
