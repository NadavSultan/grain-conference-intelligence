"use client";

import Link from "next/link";
import { useState } from "react";

import { Badge, humanizeToken, type BadgeTone } from "@/components/ui/badge";
import { ResponsiveSection, StackList, Table, Td, Th } from "@/components/ui/table";
import type { AttendanceConfidence, CrmState, PrepSnapshot, PrepStatus, RoleFit } from "@/domain/types";
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

function attendanceTone(value: AttendanceConfidence): BadgeTone {
  if (value === "confirmed" || value === "likely") return "success";
  if (value === "unknown") return "neutral";
  return "warning";
}

function roleTone(value: RoleFit): BadgeTone {
  if (value === "decision_maker") return "success";
  if (value === "influencer") return "blue";
  return "neutral";
}

function crmTone(value: CrmState): BadgeTone {
  if (value === "owned_by_me") return "success";
  if (value === "not_present") return "info";
  if (value === "owned_by_other" || value === "open_deal") return "warning";
  return "neutral";
}

function prepTone(value: PrepStatus): BadgeTone {
  if (value === "meeting_booked" || value === "replied") return "success";
  if (value === "contacted") return "blue";
  if (value === "not_now") return "neutral";
  return "warning";
}

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
      <div className="kpi-strip" role="group" aria-label="Prep summary filters">
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
              className={filter === item.id ? "kpi-chip kpi-chip-active" : "kpi-chip"}
              title={item.hint}
              onClick={() => setFilter(filter === item.id ? "all" : item.id)}
            >
              <strong>{count}</strong>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
      <p className="provenance">
        Public signals, including likely attendance; not verified check-ins. Unknown CRM, missing
        channels, unresolved identity, and already-contacted people can be relevant without being ready.
      </p>
      <ResponsiveSection
        desktop={
          <Table>
            <thead>
              <tr>
                <Th>Person</Th>
                <Th>Attendance</Th>
                <Th>ICP</Th>
                <Th>CRM</Th>
                <Th>Prep</Th>
              </tr>
            </thead>
            <tbody>
              {visible.map((record) => (
                <tr key={record.id}>
                  <Td>
                    {record.personId && record.personId in PROFILES ? (
                      <Link href={`/conferences/${conferenceId}/prep/${record.personId}`}>
                        {record.name}
                      </Link>
                    ) : (
                      record.name
                    )}
                    {record.isNew ? <p className="provenance">New</p> : null}
                  </Td>
                  <Td>
                    <Badge tone={attendanceTone(record.attendanceConfidence)}>
                      {humanizeToken(record.attendanceConfidence)}
                    </Badge>
                  </Td>
                  <Td>
                    <div className="badge-row">
                      <Badge>Tier {record.companyTier}</Badge>
                      <Badge tone={roleTone(record.roleFit)}>{humanizeToken(record.roleFit)}</Badge>
                    </div>
                  </Td>
                  <Td>
                    <Badge tone={crmTone(record.crmState)}>{crmLabel(record.crmState)}</Badge>
                  </Td>
                  <Td>
                    <div className="badge-row">
                      <Badge tone={prepTone(record.prepStatus)}>{humanizeToken(record.prepStatus)}</Badge>
                      <Badge tone="info">Fictional demo scenario</Badge>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        }
        mobile={
          <StackList className="conference-list">
            {visible.map((record) => (
              <li key={record.id}>
                <article className="conference-card">
                  <div>
                    <p className="eyebrow">
                      {humanizeToken(record.attendanceConfidence)} · Tier {record.companyTier} ·{" "}
                      {humanizeToken(record.roleFit)}
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
                      {crmLabel(record.crmState)} · {humanizeToken(record.prepStatus)}
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
          </StackList>
        }
      />
    </section>
  );
}
