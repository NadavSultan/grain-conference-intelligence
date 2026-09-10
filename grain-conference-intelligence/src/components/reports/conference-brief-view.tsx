"use client";

import Link from "next/link";

import { Alert } from "@/components/ui/alert";
import { Badge, decisionTone, humanizeToken, tierTone } from "@/components/ui/badge";
import { Button, buttonClassName } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { COMPONENT_LABELS } from "@/components/conferences/score-panel";
import { buildConferenceBrief, type ConferenceBriefReport } from "@/features/reports/conference-brief";
import { useWorkspace } from "@/workspace/provider";

export function ConferenceBriefView({ conferenceId }: { conferenceId: string }) {
  const { state } = useWorkspace();
  const result = buildConferenceBrief(conferenceId, state);

  if (result.status === "not_found") {
    return (
      <section className="page-stack">
        <h1>Conference not found</h1>
        <Link href="/conferences">Back to conferences</Link>
      </section>
    );
  }

  return <ConferenceBriefReportView report={result.report} />;
}

function ConferenceBriefReportView({ report }: { report: ConferenceBriefReport }) {
  const prepValue = (value: number | null) => (report.prep.available ? String(value) : "Unknown");

  return (
    <article className="page-stack conference-brief-report" aria-labelledby="brief-title">
      <header className="brief-toolbar">
        <div className="report-actions no-print button-row">
          <Button variant="primary" onClick={() => window.print()}>
            Print / Save PDF
          </Button>
          <Link href={`/conferences/${report.conferenceId}`} className={buttonClassName("secondary")}>
            Back to conference
          </Link>
        </div>
      </header>

      <header className="brief-masthead">
        <p className="eyebrow">Conference brief</p>
        <h1 id="brief-title">{report.name}</h1>
        <p className="lede">
          {report.startDate} – {report.endDate}
        </p>
        <p>{report.location}</p>
        <p className="provenance">
          <a href={report.sourceUrl} target="_blank" rel="noreferrer">
            Official source
          </a>
        </p>
      </header>

      {report.demoWarning ? <Alert tone="warning">{report.demoWarning}</Alert> : null}

      <section className="event-header" aria-labelledby="brief-recommendation-heading">
        <div>
          <h2 id="brief-recommendation-heading">Recommendation</h2>
          <div className="badge-row">
            <Badge tone={tierTone(report.score.tier)}>Tier {report.score.tier}</Badge>
            <Badge tone={decisionTone(report.recommendation)}>
              {humanizeToken(report.recommendation)}
            </Badge>
          </div>
          <dl className="score-meta">
            <div>
              <dt>Stored attendance decision</dt>
              <dd>{humanizeToken(report.plan.decision)}</dd>
            </div>
            <div>
              <dt>Assigned owner</dt>
              <dd>{report.plan.owner ?? "Unassigned"}</dd>
            </div>
          </dl>
        </div>
        <div className="event-score">
          <p className="metric-label">Recommendation score</p>
          <p className="score-number">{report.score.total}</p>
          <p>
            Tier {report.score.tier} · {humanizeToken(report.recommendation)}
          </p>
        </div>
      </section>

      <Card>
        <CardHeader title="Scoring breakdown" />
        {report.score.coverageWarning ? <Alert>{report.score.coverageWarning}</Alert> : null}
        <ul className="score-bars">
          {report.score.components.map((component) => (
            <li key={component.component}>
              <div className="score-bar-header">
                <strong>{COMPONENT_LABELS[component.component]}</strong>
                <span>
                  {component.points}/{component.max}
                  {component.status === "unknown" ? " · Unknown" : ""}
                </span>
              </div>
              <p className="rationale">{component.rationale}</p>
              <p className="provenance">
                <a href={component.sourceUrl} target="_blank" rel="noreferrer">
                  Source
                </a>
                {" · verified "}
                {component.verifiedAt}
              </p>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <CardHeader title="Prep summary" />
        <div className="kpi-strip">
          <PrepMetric
            testId="brief-prep-verified"
            label="Attendees verified"
            value={prepValue(report.prep.summary?.attendeesVerified ?? null)}
          />
          <PrepMetric
            testId="brief-prep-relevant"
            label="Relevant"
            value={prepValue(report.prep.summary?.relevant ?? null)}
          />
          <PrepMetric
            testId="brief-prep-ready"
            label="Ready to contact"
            value={prepValue(report.prep.summary?.readyToContact ?? null)}
          />
          <PrepMetric
            testId="brief-prep-coordination"
            label="Need coordination"
            value={prepValue(report.prep.summary?.needCoordination ?? null)}
          />
        </div>
      </Card>

      <Card>
        <CardHeader title="Top priority contacts" />
        {report.priorityContacts.length === 0 ? (
          <EmptyState title="No cached Prep snapshot exists for this event." />
        ) : (
          <ol className="stack-list">
            {report.priorityContacts.map((contact) => (
              <li key={contact.id} data-testid="brief-priority-contact" className="brief-contact">
                <strong>{contact.name}</strong>
                <p>
                  {humanizeToken(contact.attendanceConfidence)} · Tier {contact.companyTier} ·{" "}
                  {humanizeToken(contact.roleFit)} · {humanizeToken(contact.outreachStatus)}
                </p>
                {contact.fictionalLabel ? (
                  <p className="provenance">{contact.fictionalLabel}</p>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </Card>

      <Card>
        <CardHeader title="Planned meetings" />
        {report.meetings.length === 0 ? (
          <EmptyState title="No planned meetings." />
        ) : (
          <ul className="stack-list">
            {report.meetings.map((meeting) => (
              <li key={meeting.id}>
                <strong>{meeting.personName}</strong>
                <p>
                  {meeting.scheduledFor} · {humanizeToken(meeting.outcome)}
                </p>
                <p>{meeting.context}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <CardHeader title="Relationship Copilot" />
        {report.copilot.length === 0 ? (
          <EmptyState title="No saved brief." />
        ) : (
          <ul className="stack-list">
            {report.copilot.map((entry) => (
              <li key={entry.personId}>
                <strong>{entry.personName}</strong>
                {entry.stored ? (
                  <>
                    <p className="provenance">
                      {humanizeToken(entry.stored.mode)} · {entry.stored.provider} ·{" "}
                      {entry.stored.generatedAt}
                    </p>
                    <p>{entry.stored.brief.summary}</p>
                    <p>
                      <strong>Recommended action:</strong> {entry.stored.brief.recommendedAction}
                    </p>
                  </>
                ) : (
                  <p>No saved brief.</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </article>
  );
}

function PrepMetric({
  testId,
  label,
  value,
}: {
  testId: string;
  label: string;
  value: string;
}) {
  return (
    <div className="kpi-chip" data-testid={testId}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}
