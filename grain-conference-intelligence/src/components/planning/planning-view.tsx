"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { CSSProperties } from "react";

import { Badge, decisionTone, humanizeToken, tierTone } from "@/components/ui/badge";
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

  const timeline = useMemo(() => {
    const sorted = CONFERENCES.slice().sort((left, right) => left.startDate.localeCompare(right.startDate));
    const first = sorted[0]?.startDate ?? "2026-01-01";
    const last = sorted[sorted.length - 1]?.endDate ?? first;
    const firstParts = first.split("-").map(Number);
    const lastParts = last.split("-").map(Number);
    const start = Date.UTC(firstParts[0], firstParts[1] - 1, 1);
    const end = Date.UTC(lastParts[0], lastParts[1], 0);
    const totalDays = Math.max(1, Math.round((end - start) / 86_400_000) + 1);
    const ticks: Array<{ key: string; label: string; left: number }> = [];
    const cursor = new Date(start);
    while (cursor.getTime() <= end) {
      const year = cursor.getUTCFullYear();
      const month = cursor.getUTCMonth();
      const tickStart = Date.UTC(year, month, 1);
      ticks.push({
        key: `${year}-${month}`,
        label: `${MONTH_NAMES[month]} ${year}`,
        left: ((tickStart - start) / 86_400_000 / totalDays) * 100,
      });
      cursor.setUTCMonth(month + 1);
    }
    return { sorted, start, end, totalDays, ticks };
  }, []);

  const formatShortDate = (value: string) =>
    new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(
      new Date(`${value}T12:00:00`),
    );

  const barStyle = (startDate: string, endDate: string) => {
    const left = ((Date.parse(`${startDate}T12:00:00Z`) - timeline.start) / 86_400_000 / timeline.totalDays) * 100;
    const width = ((Date.parse(`${endDate}T12:00:00Z`) - Date.parse(`${startDate}T12:00:00Z`)) / 86_400_000 + 1) / timeline.totalDays * 100;
    return { left: `${Math.max(0, left)}%`, width: `${Math.max(2.5, width)}%` };
  };

  return (
    <section className="page-stack" aria-labelledby="planning-title">
      <PageHeader
        eyebrow="Annual coverage"
        title="Coverage plan"
        titleId="planning-title"
      />
      <div className="planning-callouts">
        <Card>
          <h2>Conflicts</h2>
          <p>
            {conflicts.length === 0
              ? "None"
              : conflicts.map((conflict) => {
                  const names = conflict.conferenceIds.map(
                    (id) => CONFERENCES.find((conference) => conference.id === id)?.name ?? id,
                  );
                  return `${conflict.owner}: ${names.join(" + ")}`;
                }).join("; ")}
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
      <Card className="planning-gantt-card">
        <div className="planning-gantt-header">
          <div>
            <h2>Conference coverage timeline</h2>
          </div>
          <div className="gantt-header-meta">
            <span className="gantt-range">{formatShortDate(timeline.sorted[0]?.startDate ?? "2026-01-01")} – {formatShortDate(timeline.sorted[timeline.sorted.length - 1]?.endDate ?? "2026-12-31")}</span>
            <div className="gantt-legend" aria-label="Coverage status legend">
              <span><i className="gantt-dot gantt-dot-attend" />Attend</span>
              <span><i className="gantt-dot gantt-dot-watch" />Watch</span>
              <span><i className="gantt-dot gantt-dot-undecided" />Needs decision</span>
            </div>
          </div>
        </div>
        <div className="planning-gantt-scroll">
          <div className="planning-gantt" style={{ "--gantt-columns": `${timeline.ticks.length}` } as CSSProperties}>
            <div className="gantt-label-header">Conference</div>
            <div className="gantt-axis">
              {timeline.ticks.map((tick) => <span key={tick.key} style={{ left: `${tick.left}%` }}>{tick.label}</span>)}
            </div>
            {timeline.sorted.map((conference) => {
              const plan = getConferencePlan(state.conferencePlans, conference.id);
              const snapshot = snapshotForConference(conference, PREP_SNAPSHOTS, state.activeSnapshotIds);
              const score = calculateConferenceScore(conference, snapshot);
              const cluster = clusters.find((item) => item.conferenceIds.includes(conference.id));
              const prepHref = snapshot ? `/conferences/${conference.id}?tab=prep` : `/conferences/${conference.id}`;
              return (
                <div className="gantt-row" key={conference.id}>
                  <div className="gantt-label">
                    <Link href={`/conferences/${conference.id}`}>{conference.name}</Link>
                    <span>{plan.owner ? (plan.decision === "attend" ? `Attending: ${plan.owner}` : `Assigned: ${plan.owner}`) : "No sales rep assigned"}{cluster ? ` · ${cluster.city} cluster` : ""}</span>
                  </div>
                  <div className="gantt-track">
                    {timeline.ticks.map((tick) => <span className="gantt-gridline" key={tick.key} style={{ left: `${tick.left}%` }} />)}
                    <Link href={prepHref} className={`gantt-bar gantt-bar-${plan.decision}`} style={barStyle(conference.startDate, conference.endDate)} title={`${conference.name}: ${conference.startDate} – ${conference.endDate}`}>
                      <span>{formatShortDate(conference.startDate)} – {formatShortDate(conference.endDate)}</span>
                    </Link>
                  </div>
                  <div className="gantt-score"><Badge tone={decisionTone(plan.decision)}>{humanizeToken(plan.decision)}</Badge><Badge tone={tierTone(score.tier)}>{score.total} · Tier {score.tier}</Badge></div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </section>
  );
}
