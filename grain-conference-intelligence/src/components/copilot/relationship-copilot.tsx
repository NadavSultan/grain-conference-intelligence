"use client";

import { useState } from "react";
import Link from "next/link";

import { Button, ButtonRow, buttonClassName } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CACHED_MARCUS_BRIEF } from "@/features/copilot/cached-marcus";
import { ALL_EVIDENCE, ALL_PROFILES } from "@/data/prep-snapshots";
import { CONFERENCES } from "@/data/conferences";
import { useIntegrationStatus } from "@/hooks/use-integration-status";
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
  const integrations = useIntegrationStatus();
  const [busy, setBusy] = useState(false);
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
  const current = stored?.brief ? stored : cached;
  const profile = ALL_PROFILES[personId] ?? null;
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
    try {
      const response = await fetch("/api/relationship-brief", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          mode: integrations?.mode ?? "demo",
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
            mode: "live" | "demo";
            brief: RelationshipBrief;
            provider: string;
            model: string;
            generatedAt: string;
          }
        | {
            ok: false;
            code: string;
            fallback: RelationshipBrief | null;
          };
      if (payload.ok && payload.brief) {
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
      } else if (!payload.ok && payload.fallback) {
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
      }
    } catch {
      // Keep any existing brief visible when a request cannot complete.
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
      <Button variant="primary" onClick={() => void generate()} disabled={busy || !integrations}>
        {busy ? "Generating…" : "Generate relationship brief"}
      </Button>
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
  const [linkedInCopied, setLinkedInCopied] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const summary = demoRelationshipSummary(brief);

  async function copyLinkedInDraft() {
    if (!brief.linkedInDraft) return;
    try {
      await navigator.clipboard.writeText(brief.linkedInDraft);
      setLinkedInCopied(true);
    } catch {
      setLinkedInCopied(false);
    }
  }

  function readSummary() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const utterance = new SpeechSynthesisUtterance(summary);
    utterance.onend = () => setIsReading(false);
    utterance.onerror = () => setIsReading(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setIsReading(true);
  }

  function stopReading() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsReading(false);
  }

  return (
    <div className="copilot-brief">
      <div className="copilot-status-row">
        <div>
          <span>Relationship status</span>
          <strong>{brief.state}</strong>
        </div>
        <div>
          <span>Confidence</span>
          <strong>{Math.round(brief.confidence * 100)}%</strong>
        </div>
      </div>
      <section className="copilot-insight">
        <span className="eyebrow">Relationship read</span>
        <p>{brief.summary}</p>
      </section>
      <div className="copilot-brief-grid">
        <section className="copilot-brief-section">
          <span>Known fact</span>
          <p>{brief.suggestedAngle.fact}</p>
        </section>
        <section className="copilot-brief-section">
          <span>What it means</span>
          <p>{brief.suggestedAngle.relevanceInference}</p>
        </section>
      </div>
      <section className="copilot-next-step">
        <span>Recommended next step</span>
        <p>{brief.recommendedAction}</p>
      </section>
      <div className="copilot-evidence">
        <EvidenceLinks
          label="Supporting evidence"
          ids={[...brief.evidenceEncounterIds, ...brief.evidenceSignalIds, ...brief.suggestedAngle.evidenceIds]}
          personId={personId}
          conferencePath={conferencePath}
        />
      </div>
      {brief.counterEvidence.length > 0 ? (
        <ul className="copilot-context-list" aria-label="Context to consider">
          {brief.counterEvidence.map((item) => (
            <li key={item} className="copilot-context-note">
              {item}
            </li>
          ))}
        </ul>
      ) : null}
      {brief.linkedInDraft ? (
        <>
          <label className="field-label">
            LinkedIn draft
            <textarea rows={3} defaultValue={brief.linkedInDraft} />
          </label>
          <ButtonRow className="copilot-draft-actions">
            <Button size="sm" onClick={() => void copyLinkedInDraft()}>
              {linkedInCopied ? "Copied" : "Copy LinkedIn message"}
            </Button>
          </ButtonRow>
        </>
      ) : null}
      <section className="copilot-audio-summary" aria-label="Audio summary">
        <div>
          <span className="eyebrow">Audio summary</span>
          <p>Listen to a concise spoken summary of this relationship brief.</p>
        </div>
        <Button variant="secondary" size="sm" onClick={isReading ? stopReading : readSummary}>
          {isReading ? "Stop reading" : "Listen to brief summary"}
        </Button>
      </section>
    </div>
  );
}

function demoRelationshipSummary(brief: RelationshipBrief): string {
  return `${brief.summary} ${brief.suggestedAngle.fact} Next step: ${brief.recommendedAction}`;
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
