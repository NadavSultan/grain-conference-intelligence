"use client";

import Link from "next/link";
import { CalendarClock, ClipboardList } from "lucide-react";
import { useMemo } from "react";

import { Card } from "@/components/ui/card";
import { MetricCard } from "@/components/ui/metric-card";
import { PageHeader } from "@/components/ui/page-header";
import { CONFERENCES } from "@/data/conferences";
import { PREP_SNAPSHOTS } from "@/data/prep-snapshots";
import { getConferencePlan, selectFocusItems } from "@/features/conferences/planning";
import { useWorkspace } from "@/workspace/provider";

export function FocusView() {
  const { state } = useWorkspace();
  const asOf = state.createdAt.slice(0, 10);
  const items = useMemo(
    () =>
      selectFocusItems({
        asOf,
        conferences: CONFERENCES,
        plans: state.conferencePlans,
        prepConferenceIds: [...new Set(PREP_SNAPSHOTS.map((snapshot) => snapshot.conferenceId))],
      }),
    [asOf, state.conferencePlans],
  );

  const undecided = items.filter((item) => item.kind === "undecided_conference");
  const prepLinks = items.filter((item) => item.kind === "prep_link");

  return (
    <section className="page-stack" aria-labelledby="focus-title">
      <PageHeader
        eyebrow="Today’s Focus"
        title="Decide coverage, then open cached Prep"
        titleId="focus-title"
        description="Focus only lists conferences still awaiting attend/watch/skip and direct Prep links. Opening these pages never starts research or AI."
      />
      <div className="metric-grid">
        <MetricCard
          label="Undecided upcoming"
          value={undecided.length}
          hint="Awaiting attend, watch, or skip"
          highlighted={undecided.length > 0}
        />
        <MetricCard
          label="Cached Prep"
          value={prepLinks.length}
          hint="Stored snapshots only. Opening Prep does not research live sources."
        />
      </div>
      <div className="focus-grid">
        <Card className="compact">
          <h2>
            <CalendarClock size={16} aria-hidden="true" /> Undecided upcoming conferences
          </h2>
          {undecided.length === 0 ? (
            <p className="empty">No upcoming conferences are waiting on a decision.</p>
          ) : (
            <ul className="link-list">
              {undecided.map((item) => {
                const conference = CONFERENCES.find((row) => row.id === item.conferenceId);
                const plan = getConferencePlan(state.conferencePlans, item.conferenceId);
                return (
                  <li key={item.conferenceId}>
                    <Link href={item.href}>{conference?.name ?? item.conferenceId}</Link>
                    <p>
                      {conference?.startDate} · {conference?.location} · {plan.decision}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
        <Card className="compact">
          <h2>
            <ClipboardList size={16} aria-hidden="true" /> Cached Prep
          </h2>
          {prepLinks.length === 0 ? (
            <p className="empty">No cached Prep events are linked.</p>
          ) : (
            <ul className="link-list">
              {prepLinks.map((item) => {
                const conference = CONFERENCES.find((row) => row.id === item.conferenceId);
                return (
                  <li key={`prep-${item.conferenceId}`}>
                    <Link href={item.href}>Open Prep · {conference?.name ?? item.conferenceId}</Link>
                    <p>Stored snapshot only. This link does not research live sources.</p>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </section>
  );
}
