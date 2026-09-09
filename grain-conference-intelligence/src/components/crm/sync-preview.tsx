"use client";

import { useMemo, useState } from "react";

import { buildCrmPreview } from "@/features/crm/preview";
import { runDemoSync } from "@/features/crm/demo-sync";
import { useWorkspace } from "@/workspace/provider";
import type { CrmState } from "@/domain/types";

export function SyncPreview({
  contactId,
  sourceKind,
  sourceId,
  crmState,
  conferenceName,
}: {
  contactId: string;
  sourceKind: "prep" | "encounter";
  sourceId: string;
  crmState: CrmState;
  conferenceName: string;
}) {
  const { state, dispatch } = useWorkspace();
  const [open, setOpen] = useState(false);
  const contact = state.contacts.find((item) => item.id === contactId);
  const pendingReview = state.matchReviews.some(
    (review) =>
      review.status === "pending" &&
      (review.capturedContactId === contactId || review.candidateIds.includes(contactId)),
  );
  const identityKind = pendingReview
    ? "review"
    : contact?.email?.confidence === "verified"
      ? "exact"
      : "new";
  const preview = contact
    ? buildCrmPreview({
        contact,
        crmState,
        sourceKind,
        sourceId,
        conferenceName,
        identityKind,
      })
    : null;
  const key = `${contactId}:${sourceKind}:${sourceId}`;
  const simulation = state.crmSimulations[key];
  const demoRecord = useMemo(
    () => Object.values(state.crmSimulations).find((item) => item.idempotencyKey.startsWith(`${contactId}:`) && item.contactStep.id),
    [contactId, state.crmSimulations],
  );

  function sync() {
    if (!preview?.canSync) return;
    const { result } = runDemoSync(state, {
      contactId,
      sourceKind,
      sourceId,
      crmState,
      identityKind,
      conferenceName,
    });
    dispatch({ type: "crm/record", record: result });
  }

  return (
    <section className="workspace-card compact">
      <h2>HubSpot (demo)</h2>
      <p>
        {demoRecord?.contactStep.id
          ? `View in HubSpot (demo record) ${demoRecord.contactStep.id}`
          : preview?.crmLabel ?? "Unknown"}
      </p>
      <button type="button" className="chip" onClick={() => setOpen(true)}>
        Open CRM preview
      </button>
      {open && preview ? (
        <div>
          <p className="eyebrow">Readable payload preview</p>
          <p>Identity: {preview.identityKind}</p>
          <p>
            {preview.contactName} · {preview.company}
          </p>
          <p>Source: {preview.sourceNote}</p>
          <p>Conference: {preview.conferenceContext}</p>
          <p>Fields to write: {Object.entries(preview.fieldsToWrite).map(([key, value]) => `${key}=${value}`).join("; ")}</p>
          <p>Protected (not written): {preview.protectedFields.join(", ")}</p>
          {preview.blockedReason ? <p className="demo-warning">{preview.blockedReason}</p> : null}
          <button type="button" className="chip chip-active" onClick={sync} disabled={!preview.canSync}>
            Run demo sync
          </button>
          <button
            type="button"
            className="chip"
            onClick={() => {
              const { result } = runDemoSync(state, {
                contactId,
                sourceKind,
                sourceId,
                crmState,
                identityKind,
                conferenceName,
                simulateNoteFailure: true,
              });
              dispatch({ type: "crm/record", record: result });
            }}
            disabled={!preview.canSync}
          >
            Simulate note failure
          </button>
          {simulation ? (
            <p>
              Contact step {simulation.contactStep.status} {simulation.contactStep.id ?? ""} · Note
              step {simulation.noteStep.status} {simulation.noteStep.id ?? ""}
            </p>
          ) : null}
          <p className="provenance">Demo mode only. No network request and no live HubSpot write.</p>
        </div>
      ) : null}
    </section>
  );
}
