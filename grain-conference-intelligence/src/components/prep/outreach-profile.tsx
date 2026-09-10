"use client";

import Link from "next/link";
import { Copy, Link2, Mail, MessageSquare } from "lucide-react";

import { CONFERENCES } from "@/data/conferences";
import { ALL_EVIDENCE, PREP_SNAPSHOTS, PROFILES, type FullProfileId } from "@/data/prep-snapshots";
import type { PrepStatus } from "@/domain/types";
import { snapshotForConference } from "@/features/conferences/scoring";
import { canProspect, linkedInHref, mailtoHref, slackHref } from "@/features/prep/actions";
import { RelationshipCopilot } from "@/components/copilot/relationship-copilot";
import { SyncPreview } from "@/components/crm/sync-preview";
import { Alert } from "@/components/ui/alert";
import { Button, ButtonRow, buttonClassName } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CollapseSection } from "@/components/ui/collapse-section";
import { PageHeader } from "@/components/ui/page-header";
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
      <PageHeader
        eyebrow={profile.fictionalLabel}
        title={profile.name}
        titleId="profile-title"
        description={`${profile.title} · ${profile.company}`}
        breadcrumbs={[
          { href: "/conferences", label: "Conferences" },
          { href: `/conferences/${conferenceId}?tab=prep`, label: conference.name },
          { label: profile.name },
        ]}
      />
      <p>{profile.headline}</p>
      {profile.scheduleWarning ? <Alert tone="warning">{profile.scheduleWarning}</Alert> : null}
      <p>
        <Link href={`/conferences/${conferenceId}?tab=prep`}>Back to {conference.name} Prep</Link>
      </p>

      <div className="profile-workspace">
        <div className="profile-col">
          <Card>
            <h2>Contact details</h2>
            <p>LinkedIn ({profile.contact.linkedIn.confidence}): {profile.contact.linkedIn.value}</p>
            <p>
              Email:{" "}
              {profile.contact.email
                ? `${profile.contact.email.value} (${profile.contact.email.confidence})`
                : "Unknown"}
            </p>
          </Card>

          {profile.relationshipHistory.length > 0 ? (
            <Card>
              <h2>Relationship history</h2>
              <ul>
                {profile.relationshipHistory.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </Card>
          ) : null}

          <CollapseSection title="Attendance evidence">
            <ul>
              {profile.attendanceEvidence.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </CollapseSection>

          <CollapseSection title="Why this person matters">
            <ul>
              {profile.whyThisPersonMatters.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </CollapseSection>

          <CollapseSection title="Recent signals">
            <ul>
              {profile.recentSignals.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </CollapseSection>

          <CollapseSection title="Evidence cards">
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
          </CollapseSection>

          <Card>
            <h2>Sourced angle</h2>
            <p>{profile.suggestedAngle}</p>
          </Card>

          {profile.relationshipRead.text || profile.relationshipRead.counterEvidence.length > 0 ? (
            <Card>
              <h2>{profile.relationshipRead.label}</h2>
              {profile.relationshipRead.text ? <p>{profile.relationshipRead.text}</p> : null}
              {profile.relationshipRead.counterEvidence.map((item) => (
                <Alert key={item} tone="warning">
                  Counterevidence: {item}
                </Alert>
              ))}
            </Card>
          ) : null}
        </div>

        <div className="profile-col">
          {gate.blockedReason ? <Alert tone="warning">{gate.blockedReason}</Alert> : null}
          {profile.coordinationStep ? (
            <Card>
              <h2>Coordination</h2>
              <p>{profile.coordinationStep}</p>
              <ButtonRow>
                <Button onClick={() => void copy(profile.coordinationStep ?? "")}>
                  <Copy size={14} aria-hidden="true" />
                  Copy coordination text
                </Button>
                <a className={buttonClassName("secondary")} href={slackHref()} target="_blank" rel="noreferrer">
                  <MessageSquare size={14} aria-hidden="true" />
                  Open Slack
                </a>
                <Button
                  variant="primary"
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
                </Button>
              </ButtonRow>
            </Card>
          ) : null}

          {profile.drafts.email ? (
            <Card>
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
            </Card>
          ) : (
            <p className="empty">No email action is available.</p>
          )}

          {profile.drafts.linkedIn ? (
            <Card>
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
            </Card>
          ) : null}

          <Card>
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
            <ButtonRow>
              <Button onClick={() => void copy(emailBody || linkedInBody)}>
                <Copy size={14} aria-hidden="true" />
                Copy
              </Button>
              <a
                className={buttonClassName("secondary")}
                href={linkedInHref(profile.contact.linkedIn.value)}
                target="_blank"
                rel="noreferrer"
              >
                <Link2 size={14} aria-hidden="true" />
                Open LinkedIn
              </a>
              {gate.canOpenEmail && profile.contact.email ? (
                <a className={buttonClassName("secondary")} href={mailtoHref(profile.contact.email.value)}>
                  <Mail size={14} aria-hidden="true" />
                  Open email
                </a>
              ) : (
                <Button disabled>
                  <Mail size={14} aria-hidden="true" />
                  Open email
                </Button>
              )}
              <Button
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
              </Button>
              <Button
                variant={inFieldList ? "secondary" : "primary"}
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
              </Button>
            </ButtonRow>
            <p className="provenance">No button sends email, LinkedIn, Slack, or a live HubSpot write.</p>
          </Card>
          <RelationshipCopilot
            personId={personId}
            companyId={snapshotRecord?.companyId ?? "payloom"}
            conferenceId={conferenceId}
          />
          <SyncPreview
            contactId={personId}
            sourceKind="prep"
            sourceId={snapshotRecord?.id ?? personId}
            crmState={snapshotRecord?.crmState ?? "unknown"}
            conferenceName={conference.name}
          />
        </div>
      </div>
    </article>
  );
}
