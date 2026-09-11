"use client";

import Link from "next/link";

import { Badge, humanizeToken, type BadgeTone } from "@/components/ui/badge";
import { ResponsiveSection, StackList, Table, Td, Th } from "@/components/ui/table";
import type { AttendanceConfidence, PrepSnapshot, PrepStatus } from "@/domain/types";
import { PROFILES } from "@/data/prep-snapshots";
import { crmLabel } from "@/features/prep/actions";
import {
  buildPrepViewRecords,
  calculatePrepSummary,
  filterPrepRecords,
  sortPrepRecords,
} from "@/features/prep/selectors";

function attendanceTone(value: AttendanceConfidence): BadgeTone {
  if (value === "confirmed" || value === "likely") return "success";
  if (value === "unknown") return "neutral";
  return "warning";
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
  const records = buildPrepViewRecords({
    records: snapshot.records,
    previousRecords: previous?.records,
    researchKey,
    prepStatuses,
    profiles: PROFILES,
  });
  const summary = calculatePrepSummary(records);
  const visible = sortPrepRecords(filterPrepRecords(records, "all"));
  const meetingsBooked = records.filter((record) => record.prepStatus === "meeting_booked").length;
  const outreachSent = records.filter((record) => ["contacted", "replied", "meeting_booked"].includes(record.prepStatus)).length;
  const replied = records.filter((record) => record.prepStatus === "replied").length;

  return (
    <section className="page-stack">
      <div className="prep-activity-summary" aria-label="Conference outreach activity">
        <article><span>Meetings booked</span><strong>{meetingsBooked}</strong><small>Confirmed meetings</small></article>
        <article><span>Outreach sent</span><strong>{outreachSent}</strong><small>Messages sent</small></article>
        <article><span>Replied</span><strong>{replied}</strong><small>Positive responses</small></article>
        <article><span>Verified attendees</span><strong>{summary.attendeesVerified}</strong><small>Ready for review</small></article>
      </div>
      <div className="prep-list-heading"><div><h2>Verified attendees</h2></div><span>{visible.length} people found</span></div>
      <ResponsiveSection
        desktop={
          <Table>
            <thead>
              <tr>
                <Th>Person</Th>
                <Th>Attendance</Th><Th>Role</Th><Th>Company</Th><Th>Next move</Th>
              </tr>
            </thead>
            <tbody>
              {visible.map((record) => (
                <tr key={record.id}>
                  {(() => { const profile = record.personId && record.personId in PROFILES ? PROFILES[record.personId as keyof typeof PROFILES] : null; return (<>
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
                  <Td><strong>{profile?.title ?? humanizeToken(record.roleFit)}</strong></Td>
                  <Td>{profile?.company ?? humanizeToken(record.companyId)}</Td>
                  <Td>
                    <Badge tone={prepTone(record.prepStatus)}>{record.prepStatus === "to_contact" ? "Ready to reach out" : humanizeToken(record.prepStatus)}</Badge>
                  </Td>
                  </>); })()}
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
