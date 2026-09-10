"use client";

import { useState } from "react";
import Link from "next/link";

import { Alert } from "@/components/ui/alert";
import { Button, buttonClassName } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CACHED_MARCUS_BRIEF } from "@/features/copilot/cached-marcus";
import { ALL_EVIDENCE, PROFILES, type FullProfileId } from "@/data/prep-snapshots";
import { CONFERENCES } from "@/data/conferences";
import { useWorkspace } from "@/workspace/provider";
import type { RelationshipBrief, StoredCopilotBrief } from "@/domain/types";

export function RelationshipCopilot({
  personId,
  companyId,
  conferenceId,
}: {
  personId: string;
  companyId: string;
  conferenceId?: string;
}) {
  const { state, dispatch } = useWorkspace();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const stored = state.copilotBriefs[personId];
  const cached: StoredCopilotBrief | null =
    personId === "marcus"
      ? {
          personId,
          mode: "cached",
          provider: "cached-example",
          model: "none",
          generatedAt: "cached",
          brief: CACHED_MARCUS_BRIEF,
        }
      : null;
  const current = stored ?? cached;
  const profile = personId in PROFILES ? PROFILES[personId as FullProfileId] : null;
  const contact = state.contacts.find((item) => item.id === personId);
  const canDraftEmail = profile
    ? profile.contact.email?.confidence === "verified"
    : contact?.email?.confidence === "verified";
  const canDraftLinkedIn = Boolean(profile?.contact.linkedIn ?? contact?.linkedIn);
  const conference =
    conferenceId
      ? CONFERENCES.find((item) => item.id === conferenceId || item.demoScenarioId === conferenceId)
      : undefined;

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/relationship-brief", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          personId,
          companyId,
          timeline: state.timeline.filter((entry) => entry.personId === personId),
          evidence: ALL_EVIDENCE.map((item) => ({
            id: item.id,
            personId: item.personId,
            companyId: item.companyId,
            claim: item.claim,
          })),
          canDraftEmail,
          canDraftLinkedIn,
        }),
      });
      const payload = (await response.json()) as
        | {
            ok: true;
            mode: "live";
            brief: RelationshipBrief;
            provider: string;
            model: string;
            generatedAt: string;
          }
        | {
            ok: false;
            code: string;
            fallback: RelationshipBrief;
          };
      if (payload.ok) {
        dispatch({
          type: "copilot/store",
          personId,
          stored: {
            personId,
            mode: payload.mode,
            provider: payload.provider,
            model: payload.model,
            generatedAt: payload.generatedAt,
            brief: payload.brief,
          },
        });
      } else {
        dispatch({
          type: "copilot/store",
          personId,
          stored: {
            personId,
            mode: "fallback",
            provider: "deterministic-fallback",
            model: "none",
            generatedAt: new Date().toISOString(),
            brief: payload.fallback,
          },
        });
        setError(payload.code);
      }
    } catch {
      setError("request_failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="compact" aria-labelledby={`copilot-${personId}`}>
      <h2 id={`copilot-${personId}`}>Relationship Copilot</h2>
      <p className="lede">
        Interpret stored evidence only. Opening this page does not call research or AI.
      </p>
      <Button variant="primary" onClick={() => void generate()} disabled={busy}>
        {busy ? "Generating…" : "Generate relationship brief"}
      </Button>
      {error ? <Alert tone="warning">Returned {error}. Showing the safe fallback.</Alert> : null}
      {current ? <BriefCard stored={current} personId={personId} conferencePath={conference ? `/conferences/${conference.id}/prep/${personId}` : null} /> : null}
    </Card>
  );
}

function BriefCard({
  stored,
  personId,
  conferencePath,
}: {
  stored: StoredCopilotBrief;
  personId: string;
  conferencePath: string | null;
}) {
  const brief = stored.brief;
  return (
    <div>
      <p className="eyebrow">
        {stored.mode === "live" ? "Live AI" : stored.mode === "cached" ? "Cached demo example" : "Deterministic fallback"}{" "}
        · {stored.provider}/{stored.model} · {stored.generatedAt}
      </p>
      <p>
        State {brief.state} · confidence {brief.confidence}
      </p>
      <p>{brief.summary}</p>
      <p>
        <strong>Fact:</strong> {brief.suggestedAngle.fact}
      </p>
      <p>
        <strong>Inference:</strong> {brief.suggestedAngle.relevanceInference}
      </p>
      <p>
        <strong>Recommended action:</strong> {brief.recommendedAction}
      </p>
      <EvidenceLinks
        label="Supporting evidence"
        ids={[...brief.evidenceEncounterIds, ...brief.evidenceSignalIds, ...brief.suggestedAngle.evidenceIds]}
        personId={personId}
        conferencePath={conferencePath}
      />
      {brief.counterEvidence.length > 0 ? (
        <ul>
          {brief.counterEvidence.map((item) => (
            <li key={item} className="coverage-warning">
              {item}
            </li>
          ))}
        </ul>
      ) : null}
      {brief.followUpDraft ? (
        <label className="field-label">
          Email draft
          <textarea rows={4} defaultValue={`${brief.followUpDraft.subject}\n\n${brief.followUpDraft.body}`} />
        </label>
      ) : (
        <p className="provenance">No email draft — no usable verified email channel.</p>
      )}
      {brief.linkedInDraft ? (
        <label className="field-label">
          LinkedIn draft
          <textarea rows={3} defaultValue={brief.linkedInDraft} />
        </label>
      ) : null}
    </div>
  );
}

function EvidenceLinks({
  label,
  ids,
  personId,
  conferencePath,
}: {
  label: string;
  ids: string[];
  personId: string;
  conferencePath: string | null;
}) {
  const unique = [...new Set(ids)];
  if (unique.length === 0) return null;
  return (
    <p>
      {label}:{" "}
      {unique.map((id) => {
        const href = id.startsWith("enc-") || id.startsWith("reply-") || id.startsWith("outreach-") || id.startsWith("observation-")
          ? `/relationships/${personId}#${id}`
          : conferencePath
            ? `${conferencePath}#${id}`
            : `#${id}`;
        return (
          <Link key={id} href={href} className={buttonClassName("ghost", "sm")}>
            {id}
          </Link>
        );
      })}
    </p>
  );
}
