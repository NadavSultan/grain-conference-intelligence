"use client";

import Link from "next/link";
import { useMemo } from "react";

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
      <div>
        <p className="eyebrow">Annual coverage</p>
        <h1 id="planning-title">Year list</h1>
        <p className="lede">
          Monthly grouping with owner, status, conflicts, same-city clusters, uncovered
          quarters, and Q linked to the same Prep records.
        </p>
      </div>
      <div className="status-row">
        <p>
          <strong>Conflicts:</strong>{" "}
          {conflicts.length === 0
            ? "None"
            : conflicts
                .map((conflict) => `${conflict.owner} (${conflict.conferenceIds.join(", ")})`)
                .join("; ")}
        </p>
        <p>
          <strong>Trip clusters:</strong>{" "}
          {clusters.length === 0
            ? "None"
            : clusters
                .map((cluster) => `${cluster.city} (${cluster.conferenceIds.join(", ")})`)
                .join("; ")}
        </p>
        <p>
          <strong>Uncovered quarters:</strong> {uncovered.join(", ")}
        </p>
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
                        <p className="demo-warning">Conflict for {conflict.owner}</p>
                      ) : null}
                      {cluster ? (
                        <p className="coverage-warning">Trip cluster: {cluster.city}</p>
                      ) : null}
                      <p>
                        <Link href={prepHref}>
                          {snapshot ? "Open Prep" : "Overview"}
                        </Link>
                      </p>
                    </div>
                    <div className="tier-badge" data-tier={score.tier}>
                      {score.total} · Tier {score.tier}
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
