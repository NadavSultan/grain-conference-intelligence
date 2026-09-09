"use client";

import Link from "next/link";

import { CONFERENCES } from "@/data/conferences";
import { ALL_EVIDENCE, PREP_SNAPSHOTS, PROFILES, type FullProfileId } from "@/data/prep-snapshots";
import type { PrepStatus } from "@/domain/types";
import { snapshotForConference } from "@/features/conferences/scoring";
import { canProspect, linkedInHref, mailtoHref, slackHref } from "@/features/prep/actions";
import { RelationshipCopilot } from "@/components/copilot/relationship-copilot";
import { SyncPreview } from "@/components/crm/sync-preview";
import { useWorkspace } from "@/workspace/provider";

const STATUSES: PrepStatus[] = [
  "to_contact",
  "contacted",
  "replied",
  "meeting_booked",
  "not_now",
];

export function OutreachProfile({
  conferenceId,
  personId,
}: {
  conferenceId: string;
  personId: string;
}) {
  const { state, dispatch } = useWorkspace();
  const conference = CONFERENCES.find((item) => item.id === conferenceId);
  const profile = personId in PROFILES ? PROFILES[personId as FullProfileId] : null;
  const researchKey = conference?.demoScenarioId ?? conferenceId;
  const snapshot = conference
    ? snapshotForConference(conference, PREP_SNAPSHOTS, state.activeSnapshotIds)
    : undefined;
  const snapshotRecord = snapshot?.records.find((record) => record.personId === personId);
  const statusKey = `${researchKey}:${personId}`;
  const status = state.prepStatuses[statusKey] ?? snapshotRecord?.prepStatus ?? "to_contact";
  const acknowledgedAt = state.coordinationAcknowledgements[statusKey] ?? null;
  const fieldConferenceId = researchKey;
  const inFieldList = state.fieldList.some(
    (entry) => entry.conferenceId === fieldConferenceId && entry.personId === personId,
  );

  if (!conference || !profile) {
    return (
      <section className="page-stack">
        <h1>Profile not found</h1>
        <Link href={`/conferences/${conferenceId}?tab=prep`}>Back to Prep</Link>
      </section>
    );
  }

  const gate = canProspect({
    profile,
    crmState: snapshotRecord?.crmState ?? "unknown",
    acknowledgedAt,
  });
  const emailOverride = state.outreachDrafts[statusKey]?.email;
  const linkedInOverride = state.outreachDrafts[statusKey]?.linkedin;
  const emailBody = emailOverride?.body ?? profile.drafts.email?.body ?? "";
  const emailSubject = emailOverride?.subject ?? profile.drafts.email?.subject ?? "";
  const linkedInBody = linkedInOverride?.body ?? profile.drafts.linkedIn?.body ?? "";
  const evidence = ALL_EVIDENCE.filter((item) => item.personId === personId);

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Clipboard can be unavailable in restricted browser contexts; drafts remain editable.
    }
  }

  return (
    <article className="page-stack" aria-labelledby="profile-title">
      <p className="eyebrow">{profile.fictionalLabel}</p>
      <h1 id="profile-title">{profile.name}</h1>
      <p className="lede">
        {profile.title} · {profile.company}
      </p>
      <p>{profile.headline}</p>
      <p className="demo-warning">{profile.scheduleWarning}</p>
      <p>
        <Link href={`/conferences/${conferenceId}?tab=prep`}>Back to {conference.name} Prep</Link>
      </p>

      <section className="workspace-card compact">
        <h2>Contact details</h2>
        <p>LinkedIn ({profile.contact.linkedIn.confidence}): {profile.contact.linkedIn.value}</p>
        <p>
          Email:{" "}
          {profile.contact.email
            ? `${profile.contact.email.value} (${profile.contact.email.confidence})`
            : "Unknown"}
        </p>
      </section>

      {profile.relationshipHistory.length > 0 ? (
        <section className="workspace-card compact">
          <h2>Relationship history</h2>
          <ul>
            {profile.relationshipHistory.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="workspace-card compact">
        <h2>Attendance evidence</h2>
        <ul>
          {profile.attendanceEvidence.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="workspace-card compact">
        <h2>Why this person matters</h2>
        <ul>
          {profile.whyThisPersonMatters.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="workspace-card compact">
        <h2>Recent signals</h2>
        <ul>
          {profile.recentSignals.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="workspace-card compact">
        <h2>Sourced angle</h2>
        <p>{profile.suggestedAngle}</p>
      </section>

      {profile.relationshipRead.text || profile.relationshipRead.counterEvidence.length > 0 ? (
        <section className="workspace-card compact">
          <h2>{profile.relationshipRead.label}</h2>
          {profile.relationshipRead.text ? <p>{profile.relationshipRead.text}</p> : null}
          {profile.relationshipRead.counterEvidence.map((item) => (
            <p key={item} className="coverage-warning">
              Counterevidence: {item}
            </p>
          ))}
        </section>
      ) : null}

      <section className="workspace-card compact">
        <h2>Evidence cards</h2>
        {evidence.map((item) => (
          <article key={item.id} className="evidence-card" id={item.id}>
            <p className="eyebrow">
              {item.tag} · {item.origin.replaceAll("_", " ")}
            </p>
            <p>{item.claim}</p>
            {item.quote ? <blockquote>{item.quote}</blockquote> : null}
            <p className="provenance">
              <a href={item.exhibitUrl}>{item.platform}</a>
              {item.publishedAt ? ` · ${item.publishedAt}` : ""}
            </p>
          </article>
        ))}
      </section>

      {gate.blockedReason ? <p className="demo-warning">{gate.blockedReason}</p> : null}
      {profile.coordinationStep ? (
        <section className="workspace-card compact">
          <h2>Coordination</h2>
          <p>{profile.coordinationStep}</p>
          <div className="decision-row">
            <button
              type="button"
              className="chip"
              onClick={() => void copy(profile.coordinationStep ?? "")}
            >
              Copy coordination text
            </button>
            <a className="chip" href={slackHref()} target="_blank" rel="noreferrer">
              Open Slack
            </a>
            <button
              type="button"
              className="chip"
              onClick={() =>
                dispatch({
                  type: "prep/acknowledge-coordination",
                  conferenceId: researchKey,
                  personId,
                  acknowledgedAt: new Date().toISOString(),
                })
              }
            >
              Acknowledge coordination
            </button>
          </div>
        </section>
      ) : null}

      {profile.drafts.email ? (
        <section className="workspace-card compact">
          <h2>Email draft</h2>
          <p className="provenance">
            {profile.drafts.email.sourceLabel} · {profile.drafts.email.actualWordCount} words
          </p>
          <label className="field-label">
            Subject
            <input
              value={emailSubject ?? ""}
              disabled={!gate.canDraftEmail}
              onChange={(event) =>
                dispatch({
                  type: "draft/update",
                  key: statusKey,
                  channel: "email",
                  subject: event.target.value,
                  body: emailBody,
                })
              }
            />
          </label>
          <label className="field-label">
            Body
            <textarea
              rows={8}
              value={emailBody}
              disabled={!gate.canDraftEmail}
              onChange={(event) =>
                dispatch({
                  type: "draft/update",
                  key: statusKey,
                  channel: "email",
                  subject: emailSubject,
                  body: event.target.value,
                })
              }
            />
          </label>
          <p className="provenance">{emailBody.trim().split(/\s+/u).filter(Boolean).length} words</p>
        </section>
      ) : (
        <p className="empty">No email action is available.</p>
      )}

      {profile.drafts.linkedIn ? (
        <section className="workspace-card compact">
          <h2>LinkedIn draft</h2>
          <p className="provenance">
            {profile.drafts.linkedIn.sourceLabel} · {profile.drafts.linkedIn.actualWordCount} words
          </p>
          <label className="field-label">
            Body
            <textarea
              rows={6}
              value={linkedInBody}
              disabled={!gate.canDraftLinkedIn}
              onChange={(event) =>
                dispatch({
                  type: "draft/update",
                  key: statusKey,
                  channel: "linkedin",
                  body: event.target.value,
                })
              }
            />
          </label>
        </section>
      ) : null}

      <section className="workspace-card compact">
        <h2>Next action</h2>
        <p>{profile.nextAction}</p>
        <label className="field-label">
          Prep status
          <select
            value={status}
            onChange={(event) =>
              dispatch({
                type: "prep/set-status",
                conferenceId: researchKey,
                personId,
                status: event.target.value as PrepStatus,
              })
            }
          >
            {STATUSES.map((value) => (
              <option key={value} value={value}>
                {value.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </label>
        <div className="decision-row">
          <button type="button" className="chip" onClick={() => void copy(emailBody || linkedInBody)}>
            Copy
          </button>
          <a
            className="chip"
            href={linkedInHref(profile.contact.linkedIn.value)}
            target="_blank"
            rel="noreferrer"
          >
            Open LinkedIn
          </a>
          {gate.canOpenEmail && profile.contact.email ? (
            <a className="chip" href={mailtoHref(profile.contact.email.value)}>
              Open email
            </a>
          ) : (
            <button type="button" className="chip" disabled>
              Open email
            </button>
          )}
          <button
            type="button"
            className="chip"
            onClick={() =>
              dispatch({
                type: "prep/set-status",
                conferenceId: researchKey,
                personId,
                status: "contacted",
              })
            }
          >
            Mark contacted
          </button>
          <button
            type="button"
            className="chip"
            disabled={inFieldList}
            onClick={() =>
              dispatch({
                type: "field/add",
                conferenceId: fieldConferenceId,
                personId,
              })
            }
          >
            {inFieldList ? "On field list" : "Add to field list"}
          </button>
        </div>
        <p className="provenance">No button sends email, LinkedIn, Slack, or a live HubSpot write.</p>
      </section>
      <SyncPreview
        contactId={personId}
        sourceKind="prep"
        sourceId={snapshotRecord?.id ?? personId}
        crmState={snapshotRecord?.crmState ?? "unknown"}
        conferenceName={conference.name}
      />
      <RelationshipCopilot
        personId={personId}
        companyId={snapshotRecord?.companyId ?? "payloom"}
        conferenceId={conferenceId}
      />
    </article>
  );
}
