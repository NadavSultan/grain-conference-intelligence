import type { CrmState, WorkspaceStateV1 } from "@/domain/types";
import { buildCrmPreview } from "@/features/crm/preview";

export interface DemoSyncRequest {
  contactId: string;
  sourceKind: "prep" | "encounter";
  sourceId: string;
  crmState: CrmState;
  identityKind: "exact" | "review" | "new";
  conferenceName?: string;
  simulateNoteFailure?: boolean;
}

export interface CrmStepResult {
  status: "created" | "reused" | "failed" | "blocked";
  id: string | null;
  reason?: string;
}

export interface CrmSimulationRecord {
  idempotencyKey: string;
  contactStep: CrmStepResult;
  noteStep: CrmStepResult;
}

export function runDemoSync(
  state: WorkspaceStateV1,
  request: DemoSyncRequest,
): { state: WorkspaceStateV1; result: CrmSimulationRecord } {
  const contact = state.contacts.find((item) => item.id === request.contactId);
  const idempotencyKey = `${request.contactId}:${request.sourceKind}:${request.sourceId}`;
  if (!contact) {
    const result: CrmSimulationRecord = {
      idempotencyKey,
      contactStep: { status: "blocked", id: null, reason: "Contact not found." },
      noteStep: { status: "blocked", id: null },
    };
    return { state, result };
  }

  const preview = buildCrmPreview({
    contact,
    crmState: request.crmState,
    sourceKind: request.sourceKind,
    sourceId: request.sourceId,
    conferenceName: request.conferenceName ?? request.sourceId,
    identityKind: request.identityKind,
  });

  if (!preview.canSync) {
    const result: CrmSimulationRecord = {
      idempotencyKey,
      contactStep: { status: "blocked", id: null, reason: preview.blockedReason ?? "blocked" },
      noteStep: { status: "blocked", id: null, reason: preview.blockedReason ?? "blocked" },
    };
    return { state, result };
  }

  const existing = state.crmSimulations[idempotencyKey];
  if (existing?.contactStep.id && existing.noteStep.status === "created") {
    return { state, result: { ...existing, contactStep: { ...existing.contactStep, status: "reused" }, noteStep: { ...existing.noteStep, status: "reused" } } };
  }

  const contactId = existing?.contactStep.id ?? `demo-hs-contact-${request.contactId}`;
  const contactStep: CrmStepResult = existing?.contactStep.id
    ? { status: "reused", id: contactId }
    : { status: "created", id: contactId };

  const noteStep: CrmStepResult = request.simulateNoteFailure
    ? { status: "failed", id: null, reason: "Simulated note write failure." }
    : existing?.noteStep.status === "created"
      ? { status: "reused", id: existing.noteStep.id }
      : { status: "created", id: `demo-hs-note-${idempotencyKey}` };

  const result: CrmSimulationRecord = { idempotencyKey, contactStep, noteStep };
  return {
    state: {
      ...state,
      crmSimulations: { ...state.crmSimulations, [idempotencyKey]: result },
    },
    result,
  };
}
