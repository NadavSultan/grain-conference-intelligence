"use client";

import Link from "next/link";
import { useMemo } from "react";

import { Alert } from "@/components/ui/alert";
import { Badge, decisionTone, humanizeToken, tierTone } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { CONFERENCES } from "@/data/conferences";
import { PREP_SNAPSHOTS } from "@/data/prep-snapshots";
import {
  deriveConflicts,
  deriveTripClusters,
  deriveUncoveredQuarters,
  getConferencePlan,
  planningYears,
} from "@/features/conferences/planning";
import {
  calculateConferenceScore,
  snapshotForConference,
} from "@/features/conferences/scoring";
import { useWorkspace } from "@/workspace/provider";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function PlanningView() {
  const { state } = useWorkspace();
  const years = planningYears(CONFERENCES);
  const clusters = deriveTripClusters(CONFERENCES);
  const plansWithDates = CONFERENCES.map((conference) => {
    const plan = getConferencePlan(state.conferencePlans, conference.id);
    return {
      conferenceId: conference.id,
      owner: plan.owner,
      startDate: conference.startDate,
      endDate: conference.endDate,
      decision: plan.decision,
    };
  });
  const conflicts = deriveConflicts(plansWithDates);
  const uncovered = deriveUncoveredQuarters(plansWithDates, years);

  const grouped = useMemo(() => {
    return CONFERENCES.slice()
      .sort((left, right) => left.startDate.localeCompare(right.startDate))
      .reduce<Record<string, typeof CONFERENCES>>((acc, conference) => {
        const key = conference.startDate.slice(0, 7);
        acc[key] = acc[key] ? [...acc[key], conference] : [conference];
        return acc;
      }, {});
  }, []);

  return (
    <section className="page-stack" aria-labelledby="planning-title">
      <PageHeader
        eyebrow="Annual coverage"
        title="Year list"
        titleId="planning-title"
        description="Monthly grouping with owner, status, conflicts, same-city clusters, uncovered quarters, and Q linked to the same Prep records."
      />
      <div className="planning-callouts">
        <Card>
          <h2>Conflicts</h2>
          <p>
            {conflicts.length === 0
              ? "None"
              : conflicts
                  .map((conflict) => `${conflict.owner} (${conflict.conferenceIds.join(", ")})`)
                  .join("; ")}
          </p>
        </Card>
        <Card>
          <h2>Trip clusters</h2>
          <p>
            {clusters.length === 0
              ? "None"
              : clusters
                  .map((cluster) => `${cluster.city} (${cluster.conferenceIds.join(", ")})`)
                  .join("; ")}
          </p>
        </Card>
        <Card>
          <h2>Uncovered quarters</h2>
          <p>Uncovered quarters: {uncovered.join(", ")}</p>
        </Card>
      </div>
      {Object.entries(grouped).map(([month, conferences]) => (
        <section key={month} className="month-group">
          <h2>
            {MONTH_NAMES[Number(month.slice(5, 7)) - 1]} {month.slice(0, 4)}
          </h2>
          <ul className="conference-list">
            {conferences.map((conference) => {
              const plan = getConferencePlan(state.conferencePlans, conference.id);
              const snapshot = snapshotForConference(
                conference,
                PREP_SNAPSHOTS,
                state.activeSnapshotIds,
              );
              const score = calculateConferenceScore(conference, snapshot);
              const conflict = conflicts.find((item) =>
                item.conferenceIds.includes(conference.id),
              );
              const cluster = clusters.find((item) =>
                item.conferenceIds.includes(conference.id),
              );
              const prepHref = snapshot
                ? `/conferences/${conference.id}?tab=prep`
                : `/conferences/${conference.id}`;
              return (
                <li key={conference.id}>
                  <article className="conference-card">
                    <div>
                      <p className="eyebrow">
                        {conference.startDate} – {conference.endDate}
                      </p>
                      <h3>
                        <Link href={`/conferences/${conference.id}`}>{conference.name}</Link>
                      </h3>
                      <p>
                        {plan.decision} · {plan.owner ?? "Unassigned"} · Q{" "}
                        {score.q === null ? "Unknown" : score.q}
                        {score.researchedAt ? ` · researched ${score.researchedAt}` : " · research Unknown"}
                      </p>
                      {conflict ? (
                        <Alert tone="warning">Conflict for {conflict.owner}</Alert>
                      ) : null}
                      {cluster ? (
                        <Alert>Trip cluster: {cluster.city}</Alert>
                      ) : null}
                      <p>
                        <Link href={prepHref} className={buttonClassName("ghost", "sm")}>
                          {snapshot ? "Open Prep" : "Overview"}
                        </Link>
                      </p>
                    </div>
                    <div className="badge-row">
                      <Badge tone={decisionTone(plan.decision)}>{humanizeToken(plan.decision)}</Badge>
                      <Badge tone={tierTone(score.tier)}>
                        {score.total} · Tier {score.tier}
                      </Badge>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </section>
  );
}
