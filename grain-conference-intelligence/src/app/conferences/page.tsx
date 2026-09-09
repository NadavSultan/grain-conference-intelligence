"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

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

export default function ConferencesPage() {
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
      <div>
        <p className="eyebrow">Conference discovery</p>
        <h1 id="conferences-title">Twelve sourced events</h1>
        <p className="lede">
          Scores are snapshot-labelled. Audience size is context only. Unknown research stays Unknown.
        </p>
      </div>
      <form className="filter-bar" onSubmit={(event) => event.preventDefault()}>
        <label className="field-label">
          Search
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name or city" />
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
      </form>
      <ul className="conference-list">
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
                  {score.q === null ? "Unknown" : score.q} · {plan.decision}
                  {plan.owner ? ` · ${plan.owner}` : ""}
                </p>
              </div>
              <div className="tier-badge" data-tier={score.tier}>
                {score.total} · Tier {score.tier}
              </div>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}
