"use client";

import Link from "next/link";

import { CONFERENCES } from "@/data/conferences";
import { RelationshipCopilot } from "@/components/copilot/relationship-copilot";
import { SyncPreview } from "@/components/crm/sync-preview";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
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
  const { state } = useWorkspace();
  const contact = state.contacts.find((item) => item.id === contactId);
  const entries = state.timeline
    .filter((entry) => entry.personId === contactId)
    .sort((left, right) => left.occurredAt.localeCompare(right.occurredAt));
  const planned = state.plannedMeetings.filter((meeting) => meeting.personId === contactId);
  const eligibility = deriveRelationshipEligibility(entries);

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
      {eligibility.counterEvidence.map((item) => (
        <Alert key={item} tone="warning">
          {item}
        </Alert>
      ))}
      <div className="detail-workspace">
        <div className="detail-col">
          <ul className="conference-list">
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
