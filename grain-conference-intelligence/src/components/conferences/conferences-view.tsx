"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge, decisionTone, humanizeToken, tierTone } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { ResponsiveSection, StackList, Table, Td, Th } from "@/components/ui/table";
import { Toolbar } from "@/components/ui/toolbar";
import { audienceSizeLabel, CONFERENCES } from "@/data/conferences";
import { PREP_SNAPSHOTS } from "@/data/prep-snapshots";
import { getConferencePlan } from "@/features/conferences/planning";
import {
  calculateConferenceScore,
  snapshotForConference,
} from "@/features/conferences/scoring";
import { useWorkspace } from "@/workspace/provider";

const MONTHS = [...new Set(CONFERENCES.map((conference) => conference.startDate.slice(0, 7)))].sort();
const GEOGRAPHIES = [...new Set(CONFERENCES.map((conference) => conference.geography))];
const VERTICALS = [...new Set(CONFERENCES.map((conference) => conference.vertical))];

export function ConferencesView() {
  const { state } = useWorkspace();
  const [query, setQuery] = useState("");
  const [month, setMonth] = useState("");
  const [geography, setGeography] = useState("");
  const [vertical, setVertical] = useState("");
  const [tier, setTier] = useState("");
  const [decision, setDecision] = useState("");

  const rows = useMemo(() => {
    const lowered = query.trim().toLowerCase();
    return CONFERENCES.map((conference) => {
      const snapshot = snapshotForConference(
        conference,
        PREP_SNAPSHOTS,
        state.activeSnapshotIds,
      );
      const score = calculateConferenceScore(conference, snapshot);
      const plan = getConferencePlan(state.conferencePlans, conference.id);
      return { conference, score, plan };
    }).filter(({ conference, score, plan }) => {
      if (lowered && !`${conference.name} ${conference.location}`.toLowerCase().includes(lowered)) {
        return false;
      }
      if (month && conference.startDate.slice(0, 7) !== month) return false;
      if (geography && conference.geography !== geography) return false;
      if (vertical && conference.vertical !== vertical) return false;
      if (tier && score.tier !== tier) return false;
      if (decision && plan.decision !== decision) return false;
      return true;
    });
  }, [decision, geography, month, query, state.activeSnapshotIds, state.conferencePlans, tier, vertical]);

  return (
    <section className="page-stack" aria-labelledby="conferences-title">
      <PageHeader
        eyebrow="Conference discovery"
        title="Conferences"
        titleId="conferences-title"
        description="Scores are snapshot-labelled. Audience size is context only. Unknown research stays Unknown."
      />
      <Toolbar>
        <label className="field-label">
          Search
          <span className="toolbar-search">
            <Search size={16} aria-hidden="true" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name or city" />
          </span>
        </label>
        <label className="field-label">
          Month
          <select value={month} onChange={(event) => setMonth(event.target.value)}>
            <option value="">All months</option>
            {MONTHS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label className="field-label">
          Geography
          <select value={geography} onChange={(event) => setGeography(event.target.value)}>
            <option value="">All geographies</option>
            {GEOGRAPHIES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label className="field-label">
          Vertical
          <select value={vertical} onChange={(event) => setVertical(event.target.value)}>
            <option value="">All verticals</option>
            {VERTICALS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label className="field-label">
          Tier
          <select value={tier} onChange={(event) => setTier(event.target.value)}>
            <option value="">All tiers</option>
            <option value="A">Tier A</option>
            <option value="B">Tier B</option>
            <option value="C">Tier C</option>
          </select>
        </label>
        <label className="field-label">
          Decision
          <select value={decision} onChange={(event) => setDecision(event.target.value)}>
            <option value="">All decisions</option>
            <option value="attend">Attend</option>
            <option value="watch">Watch</option>
            <option value="skip">Skip</option>
            <option value="undecided">Undecided</option>
          </select>
        </label>
      </Toolbar>
      <ResponsiveSection
        desktop={
          <Table>
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Dates</Th>
                <Th>Location</Th>
                <Th>Score</Th>
                <Th>Tier</Th>
                <Th>Plan</Th>
                <Th>Q</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ conference, score, plan }) => (
                <tr key={conference.id}>
                  <Td>
                    <Link href={`/conferences/${conference.id}`}>{conference.name}</Link>
                    <p className="provenance">{conference.vertical}</p>
                  </Td>
                  <Td>
                    {conference.startDate} – {conference.endDate}
                  </Td>
                  <Td>{conference.location}</Td>
                  <Td>{score.total}</Td>
                  <Td>
                    <Badge tone={tierTone(score.tier)}>Tier {score.tier}</Badge>
                  </Td>
                  <Td>
                    <Badge tone={decisionTone(plan.decision)}>{humanizeToken(plan.decision)}</Badge>
                    {plan.owner ? <p className="provenance">{plan.owner}</p> : null}
                  </Td>
                  <Td>{score.q === null ? "Unknown" : score.q}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        }
        mobile={
          <StackList className="conference-list">
            {rows.map(({ conference, score, plan }) => (
              <li key={conference.id}>
                <article className="conference-card">
                  <div>
                    <p className="eyebrow">
                      {conference.startDate} – {conference.endDate} · {conference.geography}
                    </p>
                    <h2>
                      <Link href={`/conferences/${conference.id}`}>{conference.name}</Link>
                    </h2>
                    <p>
                      {conference.location} · {conference.vertical}
                    </p>
                    <p className="provenance">
                      Audience {audienceSizeLabel(conference)} · Q{" "}
                      {score.q === null ? "Unknown" : score.q} · {humanizeToken(plan.decision)}
                      {plan.owner ? ` · ${plan.owner}` : ""}
                    </p>
                  </div>
                  <Badge tone={tierTone(score.tier)}>
                    {score.total} · Tier {score.tier}
                  </Badge>
                </article>
              </li>
            ))}
          </StackList>
        }
      />
    </section>
  );
}
