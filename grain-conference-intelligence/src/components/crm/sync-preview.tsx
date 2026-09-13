"use client";

import { useMemo, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonRow } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
    <Card className="compact">
      <div className="badge-row">
        <Badge tone="warning">Simulated</Badge>
      </div>
      <h2>HubSpot (demo)</h2>
      <p>
        {demoRecord?.contactStep.id
          ? `View in HubSpot (demo record) ${demoRecord.contactStep.id}`
          : preview?.crmLabel ?? "Unknown"}
      </p>
      <Button onClick={() => setOpen(true)}>Open CRM preview</Button>
      {open && preview ? (
        <div className="crm-preview-panel" aria-label="HubSpot CRM preview">
          <div className="crm-preview-heading">
            <div>
              <p className="eyebrow">CRM handoff preview</p>
              <h3>Review before sync</h3>
              <p>One clear contact update, with protected fields left untouched.</p>
            </div>
            <Badge tone={preview.canSync ? "success" : "warning"}>
              {preview.canSync ? "Ready to sync" : "Action needed"}
            </Badge>
          </div>
          <div className="crm-contact-summary">
            <div className="crm-contact-avatar" aria-hidden="true">{initials(preview.contactName)}</div>
            <div>
              <strong>{preview.contactName}</strong>
              <span>{preview.company}</span>
              <small>{identityLabel(preview.identityKind)} · {preview.crmLabel}</small>
            </div>
          </div>
          <div className="crm-preview-grid">
            <div><span>Source</span><strong>{preview.sourceNote}</strong></div>
            <div><span>Conference</span><strong>{preview.conferenceContext}</strong></div>
          </div>
          <section className="crm-payload-section">
            <div className="crm-section-heading"><span>Fields to write</span><small>Contact record</small></div>
            <div className="crm-field-list">
              {Object.entries(preview.fieldsToWrite).map(([key, value]) => (
                <div key={key}><span>{key}</span><strong>{value}</strong></div>
              ))}
            </div>
          </section>
          <section className="crm-protected-section">
            <div className="crm-section-heading"><span>Protected fields</span><small>Never overwritten</small></div>
            <div className="crm-chip-row">{preview.protectedFields.map((field) => <span key={field}>{field}</span>)}</div>
          </section>
          {preview.blockedReason ? <Alert tone="warning">{preview.blockedReason}</Alert> : null}
          <ButtonRow>
            <Button variant="primary" onClick={sync} disabled={!preview.canSync}>
              Run demo sync
            </Button>
            <Button
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
            </Button>
          </ButtonRow>
          {simulation ? (
            <div className="crm-sync-result" role="status">
              <strong>Sync result</strong>
              <span>Contact {simulation.contactStep.status} {simulation.contactStep.id ?? ""}</span>
              <span>Note {simulation.noteStep.status} {simulation.noteStep.id ?? ""}</span>
            </div>
          ) : null}
          <p className="provenance">Demo mode only. No network request and no live HubSpot write.</p>
        </div>
      ) : null}
    </Card>
  );
}

function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function identityLabel(kind: "exact" | "review" | "new"): string {
  return kind === "exact" ? "Exact identity match" : kind === "review" ? "Identity needs review" : "New contact";
}
