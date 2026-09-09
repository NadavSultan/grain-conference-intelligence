"use client";

import Link from "next/link";
import { useMemo } from "react";

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
      <div>
        <p className="eyebrow">Today’s Focus</p>
        <h1 id="focus-title">Decide coverage, then open cached Prep</h1>
        <p className="lede">
          Focus only lists conferences still awaiting attend/watch/skip and direct Prep
          links. Opening these pages never starts research or AI.
        </p>
      </div>
      <div className="focus-grid">
        <article className="workspace-card compact">
          <h2>Undecided upcoming conferences</h2>
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
        </article>
        <article className="workspace-card compact">
          <h2>Cached Prep</h2>
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
        </article>
      </div>
    </section>
  );
}
