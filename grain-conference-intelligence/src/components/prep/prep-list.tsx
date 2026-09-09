"use client";

import Link from "next/link";
import { useState } from "react";

import type { PrepSnapshot, PrepStatus } from "@/domain/types";
import { PROFILES } from "@/data/prep-snapshots";
import { crmLabel } from "@/features/prep/actions";
import {
  buildPrepViewRecords,
  calculatePrepSummary,
  filterPrepRecords,
  sortPrepRecords,
  type PrepSummaryFilter,
} from "@/features/prep/selectors";

const FILTERS: { id: PrepSummaryFilter; label: string; hint?: string }[] = [
  { id: "verified", label: "Attendees verified", hint: "Public signals, including likely attendance; not verified check-ins." },
  { id: "relevant", label: "Relevant" },
  { id: "ready", label: "Ready to contact" },
  { id: "coordination", label: "Need coordination" },
];

export function PrepList({
  conferenceId,
  researchKey,
  snapshot,
  previous,
  prepStatuses,
}: {
  conferenceId: string;
  researchKey: string;
  snapshot: PrepSnapshot;
  previous?: PrepSnapshot;
  prepStatuses: Record<string, PrepStatus>;
}) {
  const [filter, setFilter] = useState<PrepSummaryFilter | "all">("all");
  const records = buildPrepViewRecords({
    records: snapshot.records,
    previousRecords: previous?.records,
    researchKey,
    prepStatuses,
    profiles: PROFILES,
  });
  const summary = calculatePrepSummary(records);
  const visible = sortPrepRecords(filterPrepRecords(records, filter));

  return (
    <section className="page-stack">
      <div className="summary-strip" role="group" aria-label="Prep summary filters">
        {FILTERS.map((item) => {
          const count =
            item.id === "verified"
              ? summary.attendeesVerified
              : item.id === "relevant"
                ? summary.relevant
                : item.id === "ready"
                  ? summary.readyToContact
                  : summary.needCoordination;
          return (
            <button
              key={item.id}
              type="button"
              className={filter === item.id ? "chip chip-active" : "chip"}
              onClick={() => setFilter(filter === item.id ? "all" : item.id)}
            >
              <strong>{count}</strong> {item.label}
            </button>
          );
        })}
      </div>
      <p className="provenance">
        Public signals, including likely attendance; not verified check-ins. Unknown CRM, missing
        channels, unresolved identity, and already-contacted people can be relevant without being ready.
      </p>
      <ul className="conference-list">
        {visible.map((record) => (
          <li key={record.id}>
            <article className="conference-card">
              <div>
                <p className="eyebrow">
                  {record.attendanceConfidence.replaceAll("_", " ")} · Tier {record.companyTier} ·{" "}
                  {record.roleFit.replaceAll("_", " ")}
                </p>
                <h3>
                  {record.personId && record.personId in PROFILES ? (
                    <Link href={`/conferences/${conferenceId}/prep/${record.personId}`}>
                      {record.name}
                    </Link>
                  ) : (
                    record.name
                  )}
                </h3>
                <p>
                  {crmLabel(record.crmState)} · {record.prepStatus.replaceAll("_", " ")}
                  {record.isNew ? " · New" : ""}
                </p>
                <p className="provenance">
                  Origin: fictional demo scenario · identity{" "}
                  {record.identityResolved ? "resolved" : "needs review"} · channel{" "}
                  {record.hasUsableChannel ? "usable" : "Unknown"}
                </p>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}
