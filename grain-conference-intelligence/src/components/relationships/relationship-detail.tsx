"use client";

import Link from "next/link";
import { useState } from "react";
import { AtSign, CheckCircle2, ExternalLink, Mail, MessageCircle, Sparkles, X } from "lucide-react";

import { CONFERENCES } from "@/data/conferences";
import { FULL_PROFILE_IDS, PROFILES, type FullProfileId } from "@/data/prep-snapshots";
import { RelationshipCopilot } from "@/components/copilot/relationship-copilot";
import { SyncPreview } from "@/components/crm/sync-preview";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { deriveRelationshipEligibility } from "@/features/relationships/eligibility";
import { useWorkspace } from "@/workspace/provider";
import type { TimelineKind } from "@/domain/types";

const LABELS: Record<TimelineKind, string> = {
  research_observation: "Research",
  outreach_sent: "Outreach sent",
  reply: "Reply",
  planned_meeting: "Planned meeting",
  actual_encounter: "Met",
};

export function RelationshipDetail({ contactId }: { contactId: string }) {
  const { state, dispatch } = useWorkspace();
  const contact = state.contacts.find((item) => item.id === contactId);
  const entries = state.timeline
    .filter((entry) => entry.personId === contactId)
    .sort((left, right) => left.occurredAt.localeCompare(right.occurredAt));
  const planned = state.plannedMeetings.filter((meeting) => meeting.personId === contactId);
  const eligibility = deriveRelationshipEligibility(entries);
  const profile = FULL_PROFILE_IDS.includes(contactId as FullProfileId)
    ? PROFILES[contactId as FullProfileId]
    : null;
  const conferenceNames = Array.from(
    new Set(
      [...entries.map((entry) => entry.conferenceId), ...planned.map((meeting) => meeting.conferenceId)]
        .map((conferenceId) =>
          CONFERENCES.find((item) => item.id === conferenceId) ??
          CONFERENCES.find((item) => item.demoScenarioId === conferenceId),
        )
        .filter(Boolean)
        .map((conference) => conference?.name),
    ),
  );
  const profileConferenceContext = conferenceNames.length
    ? conferenceNames.join(", ")
    : profile
      ? "Money20/20 Europe (research context)"
      : "None recorded";
  const profileSignals = profile?.recentSignals.slice(0, 3) ?? [];
  const profilePainPoints = profile?.whyThisPersonMatters
    .filter((item) => /currency|settlement|treasury|hedg|margin|payout|exposure|cross-border/i.test(item))
    .slice(0, 3) ?? [];
  const outreachDraft = profile?.drafts.linkedIn ?? profile?.drafts.email;
  const [isReachOutOpen, setIsReachOutOpen] = useState(false);
  const [message, setMessage] = useState(() => cleanDemoCopy(outreachDraft?.body ?? ""));
  const [sent, setSent] = useState(false);

  if (!contact) {
    return (
      <section className="page-stack">
        <h1>Contact not found</h1>
        <Link href="/relationships">Back</Link>
      </section>
    );
  }

  const encounterOrdinalById = new Map<string, number>();
  let encounterOrdinal = 0;
  for (const entry of entries) {
    if (entry.kind === "actual_encounter") {
      encounterOrdinal += 1;
      encounterOrdinalById.set(entry.id, encounterOrdinal);
    }
  }

  return (
    <section className="page-stack" aria-labelledby="contact-title">
      <PageHeader
        eyebrow={`${eligibility.state} · ${eligibility.encounterCount} actual meetings`}
        title={contact.name}
        titleId="contact-title"
        description={`${contact.role} · ${contact.company}`}
        breadcrumbs={[
          { href: "/relationships", label: "Relationships" },
          { label: contact.name },
        ]}
        actions={
          <Link href="/relationships" className={buttonClassName("ghost", "sm")}>
            All relationships
          </Link>
        }
      />
      {profile ? (
        <Card className="relationship-profile-card">
          <div className="relationship-profile-head">
            <div className="profile-avatar" aria-hidden="true">
              {profile.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}
            </div>
            <div>
              <h2>{profile.name}</h2>
              <p>{profile.title} · {profile.company}</p>
              <p className="profile-verified-status"><CheckCircle2 size={15} aria-hidden="true" /><strong>Status: Verified attending</strong><span>{cleanDemoCopy(profile.headline.replace(/^confirmed attending(?:\s*\([^)]*\))?\s*·?\s*/i, ""))}</span></p>
            </div>
            <div className="relationship-profile-contact-actions">
              <a href={profile.contact.linkedIn.value.startsWith("http") ? profile.contact.linkedIn.value : `https://${profile.contact.linkedIn.value}`} target="_blank" rel="noreferrer" title="Open LinkedIn profile"><AtSign size={15} aria-hidden="true" /></a>
              {profile.contact.email ? <a href={`mailto:${profile.contact.email.value}`} title="Open email"><Mail size={15} aria-hidden="true" /></a> : null}
              <Link href={`/relationships/${contact.id}#outreach`} title="Jump to outreach"><MessageCircle size={15} aria-hidden="true" /></Link>
            </div>
          </div>
          <div className="relationship-profile-summary">
            <div className="profile-signal-panel">
              <div className="profile-panel-heading"><Sparkles size={15} aria-hidden="true" /><h3>Buying signals</h3></div>
              <ul className="profile-signal-list profile-buying-list">
                {profileSignals.map((signal) => <li key={signal}><strong>{signalLabel(signal)}</strong><span>{signalDetail(signal)}</span></li>)}
              </ul>
            </div>
            <div className="profile-signal-panel">
              <div className="profile-panel-heading"><ExternalLink size={15} aria-hidden="true" /><h3>Latest signals</h3></div>
              <ul className="profile-signal-list">{profileSignals.map((signal) => <li key={signal}>{cleanDemoCopy(signal)}</li>)}</ul>
            </div>
            <div className="profile-signal-panel">
              <div className="profile-panel-heading"><Sparkles size={15} aria-hidden="true" /><h3>Pain points</h3></div>
              <ul className="profile-signal-list">{profilePainPoints.length ? profilePainPoints.map((item) => <li key={item}>{cleanDemoCopy(item)}</li>) : <li>Qualify current FX exposure and treasury workflow.</li>}</ul>
            </div>
          </div>
          <div className="relationship-profile-footer">
            <div className="profile-next-step"><span>Next best action</span><ul className="next-action-list">{actionBullets(profile.nextAction).map((action) => <li key={action}>{cleanDemoCopy(action)}</li>)}</ul><small>{profileConferenceContext}</small></div>
            <div className="relationship-outreach-message" id="outreach">
              <span>{profile.drafts.linkedIn ? "LinkedIn message" : "Email draft"}</span>
              <p>{cleanDemoCopy(outreachDraft?.body ?? "No outreach draft is available yet.")}</p>
              <button type="button" className={buttonClassName("primary", "sm")} onClick={() => { setSent(false); setIsReachOutOpen(true); }}>Reach out</button>
            </div>
          </div>
          {isReachOutOpen ? (
            <div className="outreach-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setIsReachOutOpen(false); }}>
              <div className="outreach-modal" role="dialog" aria-modal="true" aria-labelledby="reach-out-title">
                <div className="outreach-modal-header">
                  <div><span className="eyebrow">{profile.drafts.linkedIn ? "LinkedIn message" : "Email draft"}</span><h2 id="reach-out-title">Reach out to {profile.name}</h2><p>Personalize this message before sending.</p></div>
                  <button type="button" className="outreach-modal-close" aria-label="Close reach out window" onClick={() => setIsReachOutOpen(false)}><X size={18} aria-hidden="true" /></button>
                </div>
                <label className="outreach-modal-label" htmlFor="outreach-message">Message</label>
                <textarea id="outreach-message" className="outreach-modal-textarea" value={message} onChange={(event) => setMessage(event.target.value)} rows={8} />
                <div className="outreach-modal-footer">
                  {sent ? <span className="outreach-sent">Message ready to send</span> : <span className="outreach-modal-hint">Review the conference context, then send when ready.</span>}
                  <div className="outreach-modal-actions"><button type="button" className={buttonClassName("ghost", "sm")} onClick={() => setIsReachOutOpen(false)}>Cancel</button><button type="button" className={buttonClassName("primary", "sm")} onClick={() => { dispatch({ type: "timeline/add-outreach", personId: contact.id, conferenceId: "money20-eu-demo", company: profile.company, role: profile.title, summary: `Outreach sent via ${profile.drafts.linkedIn ? "LinkedIn" : "email"}.`, occurredAt: new Date().toISOString() }); dispatch({ type: "prep/set-status", conferenceId: "money20-eu-demo", personId: contact.id, status: "contacted" }); setSent(true); }}>Send</button></div>
                </div>
              </div>
            </div>
          ) : null}
      </Card>
      ) : null}
      <div className="detail-workspace">
        <div className="detail-col">
          <Card className="relationship-history-card">
            <div className="relationship-history-heading"><div><h2>Relationship history</h2><p>Conference meetings and communication in order.</p></div><span>{entries.length + planned.length} records</span></div>
          <ul className="relationship-history-list">
            {planned.map((meeting) => {
              const conference =
                CONFERENCES.find((item) => item.id === meeting.conferenceId) ??
                CONFERENCES.find((item) => item.demoScenarioId === meeting.conferenceId);
              return (
                <li key={meeting.id}>
                  <article className="conference-card">
                    <div>
                      <p className="eyebrow">Planned meeting · {meeting.outcome}</p>
                      <p>{meeting.context}</p>
                      <p className="provenance">
                        {conference ? (
                          <Link href={`/conferences/${conference.id}`}>{conference.name}</Link>
                        ) : (
                          meeting.conferenceId
                        )}
                        {" · "}
                        {meeting.scheduledFor}
                      </p>
                    </div>
                    <Badge>{meeting.outcome.replaceAll("_", " ")}</Badge>
                  </article>
                </li>
              );
            })}
            {profile ? profile.relationshipHistory.map((item) => (
              <li key={`profile-history-${item}`}>
                <article className="conference-card">
                  <div><p className="eyebrow">Profile context</p><p>{cleanDemoCopy(item)}</p><p className="provenance">{profileConferenceContext}</p></div>
                  <Badge tone="info">Context</Badge>
                </article>
              </li>
            )) : null}
            {entries.map((entry) => {
              const conference =
                CONFERENCES.find((item) => item.id === entry.conferenceId) ??
                CONFERENCES.find((item) => item.demoScenarioId === entry.conferenceId);
              return (
                <li key={entry.id} id={entry.id}>
                  <article className="conference-card">
                    <div>
                      <p className="eyebrow">
                        {LABELS[entry.kind]}
                        {entry.kind === "actual_encounter"
                          ? ` · Encounter ${encounterOrdinalById.get(entry.id)}`
                          : ""}
                      </p>
                      <p>{entry.summary}</p>
                      <p>
                        {entry.company} · {entry.role}
                        {entry.nextStep ? ` · Next: ${entry.nextStep}` : ""}
                      </p>
                      <p className="provenance">
                        {conference ? (
                          <Link href={`/conferences/${conference.id}`}>{conference.name}</Link>
                        ) : (
                          entry.conferenceId
                        )}
                        {" · "}
                        {entry.occurredAt}
                      </p>
                    </div>
                    <Badge tone={entry.kind === "actual_encounter" ? "success" : "neutral"}>
                      {LABELS[entry.kind]}
                    </Badge>
                  </article>
                </li>
              );
            })}
          </ul>
          </Card>
        </div>
        <div className="detail-col">
          <RelationshipCopilot
            personId={contactId}
            companyId={contact.company.toLowerCase().replace(/[^a-z0-9]+/g, "-")}
            conferenceId={entries[0]?.conferenceId}
          />
          <SyncPreview
            contactId={contactId}
            sourceKind={entries.some((entry) => entry.kind === "actual_encounter") ? "encounter" : "prep"}
            sourceId={
              entries.filter((entry) => entry.kind === "actual_encounter").at(-1)?.id ??
              `prep-${contactId}`
            }
            crmState={contactId === "david" ? "owned_by_other" : contactId === "marcus" ? "owned_by_me" : "not_present"}
            conferenceName={
              CONFERENCES.find((item) => item.demoScenarioId === "money20-eu-demo")?.name ??
              "Money20/20 Europe"
            }
          />
        </div>
      </div>
    </section>
  );
}

function cleanDemoCopy(value: string): string {
  return value
    .replace(/—\s*Verified\s*fictional\s*exhibit/gi, "— Verified")
    .replace(/\bfictional\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.])/g, "$1")
    .replace(/Verified exhibit/gi, "Verified")
    .replace(/^None\.\s*/i, "No prior relationship. ")
    .trim()
    .replace(/(^|[.!?]\s+)([a-z])/g, (_, prefix: string, letter: string) => `${prefix}${letter.toUpperCase()}`);
}

function signalLabel(signal: string): string {
  const lower = signal.toLowerCase();
  if (lower.includes("attend")) return "Confirmed conference attendance";
  if (lower.includes("currency") || lower.includes("settlement")) return "Multi-currency expansion";
  if (lower.includes("hiring") || lower.includes("role opened")) return "Treasury hiring signal";
  if (lower.includes("panel") || lower.includes("speaker")) return "Conference speaking role";
  if (lower.includes("rsvp") || lower.includes("side-event")) return "Side-event attendance";
  if (lower.includes("annual report")) return "FX margin pressure";
  if (lower.includes("press exhibit") || lower.includes("acquired")) return "New market cost exposure";
  return cleanDemoCopy(signal.replace(/^\d+\s+[^—]+—\s*/, ""));
}

function signalDetail(signal: string): string {
  return cleanDemoCopy(signal.replace(/^\d+\s+[^—]+—\s*/, ""));
}

function actionBullets(value: string): string[] {
  return value.split(/(?<=[.!?])\s+/).filter(Boolean).slice(0, 3);
}
