import { workspaceStateV1Schema } from "@/domain/schemas";
import type { WorkspaceStateV1 } from "@/domain/types";

const DEMO_CLOCK = "2026-05-20T09:00:00.000Z";

export function createDemoWorkspace(): WorkspaceStateV1 {
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
    ],
    prepStatuses: {},
    coordinationAcknowledgements: {},
    activeSnapshotIds: {},
    simulatedResearchRuns: {},
  });
}
