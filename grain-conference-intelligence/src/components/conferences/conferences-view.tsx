"use client";

import Link from "next/link";
import { Clock3, LayoutList, Map, Search } from "lucide-react";
import { useMemo, useState, type KeyboardEvent } from "react";

import { Badge, decisionTone, humanizeToken, tierTone } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { StackList, Table, Td, Th } from "@/components/ui/table";
import { audienceSizeLabel, CONFERENCES } from "@/data/conferences";
import { PREP_SNAPSHOTS } from "@/data/prep-snapshots";
import { getConferencePlan } from "@/features/conferences/planning";
import { calculateConferenceScore, snapshotForConference } from "@/features/conferences/scoring";
import { useWorkspace } from "@/workspace/provider";

const MONTHS = [...new Set(CONFERENCES.map((conference) => conference.startDate.slice(0, 7)))].sort();
const GEOGRAPHIES = [...new Set(CONFERENCES.map((conference) => conference.geography))];
const VERTICALS = [...new Set(CONFERENCES.map((conference) => conference.vertical))];
type CatalogView = "table" | "timeline" | "regions";
type KpiFilter = "tier-a" | "team-deployed" | "coverage-gaps" | null;

type ConferenceRow = {
  conference: (typeof CONFERENCES)[number];
  score: ReturnType<typeof calculateConferenceScore>;
  plan: ReturnType<typeof getConferencePlan>;
};

export function ConferencesView() {
  const { state } = useWorkspace();
  const [query, setQuery] = useState("");
  const [month, setMonth] = useState("");
  const [geography, setGeography] = useState("");
  const [vertical, setVertical] = useState("");
  const [tier, setTier] = useState("");
  const [decision, setDecision] = useState("");
  const [view, setView] = useState<CatalogView>("table");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [kpiFilter, setKpiFilter] = useState<KpiFilter>(null);

  const baseRows = useMemo<ConferenceRow[]>(() => {
    const lowered = query.trim().toLowerCase();
    return CONFERENCES.map((conference) => {
      const snapshot = snapshotForConference(conference, PREP_SNAPSHOTS, state.activeSnapshotIds);
      const score = calculateConferenceScore(conference, snapshot);
      const plan = getConferencePlan(state.conferencePlans, conference.id);
      return { conference, score, plan };
    }).filter(({ conference, score, plan }) => {
      if (lowered && !`${conference.name} ${conference.location} ${conference.vertical}`.toLowerCase().includes(lowered)) return false;
      if (month && conference.startDate.slice(0, 7) !== month) return false;
      if (geography && conference.geography !== geography) return false;
      if (vertical && conference.vertical !== vertical) return false;
      if (tier && score.tier !== tier) return false;
      if (decision && plan.decision !== decision) return false;
      return true;
    });
  }, [decision, geography, month, query, state.activeSnapshotIds, state.conferencePlans, tier, vertical]);

  const rows = useMemo(() => {
    if (kpiFilter === "tier-a") return baseRows.filter((row) => row.score.tier === "A");
    if (kpiFilter === "team-deployed") return baseRows.filter((row) => row.plan.decision === "attend");
    if (kpiFilter === "coverage-gaps") return baseRows.filter((row) => row.plan.decision === "undecided");
    return baseRows;
  }, [baseRows, kpiFilter]);

  const selected = rows.find((row) => row.conference.id === selectedId) ?? rows[0];
  const tierAPriority = baseRows.filter((row) => row.score.tier === "A").length;
  const attending = baseRows.filter((row) => row.plan.decision === "attend").length;
  const undecided = baseRows.filter((row) => row.plan.decision === "undecided").length;

  function onRowKeyDown(event: KeyboardEvent<HTMLTableRowElement>, id: string) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setSelectedId(id);
    }
  }

  return (
    <section className="page-stack" aria-labelledby="conferences-title">
      <PageHeader
        eyebrow="Discovery and decisions"
        title="Conferences"
        titleId="conferences-title"
        description="Prioritize the right rooms, assign coverage, and keep evidence gaps visible. Scores remain tied to stored snapshots."
        actions={<Link href="/planning" className={buttonClassName("secondary")}>Open annual plan</Link>}
      />

      <div className="metric-grid conference-metrics">
        <KpiCard
          label="Tier A priority events"
          value={tierAPriority}
          hint={`${attending} attending · ${undecided} need a decision`}
          active={kpiFilter === "tier-a"}
          onClick={() => setKpiFilter(kpiFilter === "tier-a" ? null : "tier-a")}
        />
        <KpiCard
          label="Verified events"
          value={baseRows.length}
          hint="Repository conference records"
          active={kpiFilter === null}
          onClick={() => setKpiFilter(null)}
        />
        <KpiCard
          label="Team deployed"
          value={attending}
          hint="Events with an attend decision"
          active={kpiFilter === "team-deployed"}
          onClick={() => setKpiFilter(kpiFilter === "team-deployed" ? null : "team-deployed")}
        />
        <KpiCard
          label="Coverage gaps"
          value={undecided}
          hint="Events still awaiting a decision"
          active={kpiFilter === "coverage-gaps"}
          highlighted={undecided > 0}
          onClick={() => setKpiFilter(kpiFilter === "coverage-gaps" ? null : "coverage-gaps")}
        />
      </div>

      <section className="conference-catalog ui-card" aria-label="Conference catalog">
        <div className="conference-catalog-top">
          <div className="view-tabs" role="group" aria-label="Conference catalog views">
            <button type="button" className={view === "table" ? "active" : ""} aria-pressed={view === "table"} onClick={() => setView("table")}><LayoutList size={15} aria-hidden="true" /> Table</button>
            <button type="button" className={view === "timeline" ? "active" : ""} aria-pressed={view === "timeline"} onClick={() => setView("timeline")}><Clock3 size={15} aria-hidden="true" /> Timeline</button>
            <button type="button" className={view === "regions" ? "active" : ""} aria-pressed={view === "regions"} onClick={() => setView("regions")}><Map size={15} aria-hidden="true" /> Regions</button>
          </div>
          <label className="catalog-search"><Search size={16} aria-hidden="true" /><span className="sr-only">Search conferences</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, location, or vertical" /></label>
        </div>

        <div className="conference-filter-row">
          <label className="compact-filter">Month<select value={month} onChange={(event) => setMonth(event.target.value)}><option value="">All months</option>{MONTHS.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
          <label className="compact-filter">Geography<select value={geography} onChange={(event) => setGeography(event.target.value)}><option value="">All geographies</option>{GEOGRAPHIES.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
          <label className="compact-filter">Vertical<select value={vertical} onChange={(event) => setVertical(event.target.value)}><option value="">All verticals</option>{VERTICALS.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
          <label className="compact-filter">Tier<select value={tier} onChange={(event) => setTier(event.target.value)}><option value="">All tiers</option><option value="A">Tier A</option><option value="B">Tier B</option><option value="C">Tier C</option></select></label>
          <label className="compact-filter">Decision<select value={decision} onChange={(event) => setDecision(event.target.value)}><option value="">All decisions</option><option value="attend">Attend</option><option value="watch">Watch</option><option value="skip">Skip</option><option value="undecided">Undecided</option></select></label>
          <span className="catalog-count">{rows.length} of {CONFERENCES.length} verified events</span>
        </div>

        {view === "table" ? (
          <div className="conference-split">
            <div className="conference-list-pane">
              <div className="desktop-only">
                <Table className="conference-data-table">
                  <thead><tr><Th>Conference</Th><Th>Date & location</Th><Th>Vertical</Th><Th>Score</Th><Th>Decision</Th></tr></thead>
                  <tbody>
                    {rows.map(({ conference, score, plan }) => (
                      <tr key={conference.id} className={selected?.conference.id === conference.id ? "conference-row-selected" : ""} aria-selected={selected?.conference.id === conference.id} tabIndex={0} onClick={() => setSelectedId(conference.id)} onKeyDown={(event) => onRowKeyDown(event, conference.id)}>
                        <Td><Link href={`/conferences/${conference.id}`} onClick={(event) => event.stopPropagation()}>{conference.name}</Link><p className="provenance">{conference.geography}</p></Td>
                        <Td>{conference.startDate} – {conference.endDate}<p className="provenance">{conference.location}</p></Td>
                        <Td>{conference.vertical}</Td>
                        <Td><strong className="catalog-score">{score.total}</strong><p className="provenance">Tier {score.tier}</p></Td>
                        <Td><Badge tone={decisionTone(plan.decision)}>{humanizeToken(plan.decision)}</Badge>{plan.owner ? <p className="provenance">{plan.owner}</p> : null}</Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
              <div className="mobile-only">
                <StackList className="conference-mobile-list">
                  {rows.map(({ conference, score, plan }) => (
                    <li key={conference.id}><article className={selected?.conference.id === conference.id ? "conference-mobile-card selected" : "conference-mobile-card"} onClick={() => setSelectedId(conference.id)}><div><p className="eyebrow">{conference.startDate} · {conference.geography}</p><h2><Link href={`/conferences/${conference.id}`} onClick={(event) => event.stopPropagation()}>{conference.name}</Link></h2><p>{conference.location} · {conference.vertical}</p><p className="provenance">Audience {audienceSizeLabel(conference)} · {humanizeToken(plan.decision)}{plan.owner ? ` · ${plan.owner}` : ""}</p></div><Badge tone={tierTone(score.tier)}>{score.total} · Tier {score.tier}</Badge></article></li>
                  ))}
                </StackList>
              </div>
            </div>
            <ConferenceSelection selected={selected} />
          </div>
        ) : view === "timeline" ? <TimelineView rows={rows} /> : <RegionsView rows={rows} />}
      </section>
    </section>
  );
}

function KpiCard({
  label,
  value,
  hint,
  active,
  highlighted = false,
  onClick,
}: {
  label: string;
  value: number;
  hint: string;
  active: boolean;
  highlighted?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`metric-card kpi-card${active ? " kpi-card-active" : ""}${highlighted ? " metric-card-highlight" : ""}`}
      aria-pressed={active}
      onClick={onClick}
    >
      <span className="metric-label">{label}</span>
      <span className="metric-value">{value}</span>
      <span className="metric-hint">{hint}</span>
    </button>
  );
}

function ConferenceSelection({ selected }: { selected?: ConferenceRow }) {
  if (!selected) return <aside className="conference-detail-panel" aria-label="Selected conference"><p className="empty">No conferences match these filters.</p></aside>;
  const { conference, score, plan } = selected;
  return (
    <aside className="conference-detail-panel" aria-label="Selected conference">
      <p className="eyebrow">Selected conference</p><h2>{conference.name}</h2><p className="lede">{conference.startDate} – {conference.endDate} · {conference.location}</p>
      <div className="detail-score-block"><span>Recommendation score</span><strong>{score.total}</strong><Badge tone={tierTone(score.tier)}>Tier {score.tier}</Badge></div>
      <div className="detail-block"><div className="detail-row"><span>Decision</span><strong>{humanizeToken(plan.decision)}</strong></div><div className="detail-row"><span>Owner</span><strong>{plan.owner ?? "Unassigned"}</strong></div><div className="detail-row"><span>Audience</span><strong>{audienceSizeLabel(conference)}</strong></div></div>
      <div className="detail-block"><p className="eyebrow">Evidence status</p><p className="provenance">Stored source record · verified {conference.verifiedAt}</p></div>
      <Link className={buttonClassName("primary")} href={`/conferences/${conference.id}`}>Open conference workspace</Link>
    </aside>
  );
}

function TimelineView({ rows }: { rows: ConferenceRow[] }) {
  return <div className="catalog-alternate"><h2>Conference timeline</h2><p className="lede">Dates and decisions across the verified conference catalog.</p><ul className="catalog-timeline">{rows.map(({ conference, score, plan }) => <li key={conference.id}><div className="timeline-date">{conference.startDate}<strong>{conference.endDate}</strong></div><div><h3><Link href={`/conferences/${conference.id}`}>{conference.name}</Link></h3><p>{conference.location} · {conference.vertical}</p></div><Badge tone={decisionTone(plan.decision)}>{humanizeToken(plan.decision)}</Badge><span className="catalog-score">{score.total}</span></li>)}</ul></div>;
}

function RegionsView({ rows }: { rows: ConferenceRow[] }) {
  const regions = rows.reduce<Record<string, ConferenceRow[]>>((groups, row) => { (groups[row.conference.geography] ??= []).push(row); return groups; }, {});
  return <div className="catalog-alternate"><h2>Conference regions</h2><p className="lede">Browse the same verified records by geography.</p><div className="region-grid">{Object.entries(regions).map(([region, regionRows]) => <section key={region} className="region-card"><div className="section-heading"><h3>{region}</h3><span>{regionRows.length} events</span></div><ul>{regionRows.map(({ conference, score }) => <li key={conference.id}><Link href={`/conferences/${conference.id}`}>{conference.name}</Link><span>{conference.location} · {score.total}</span></li>)}</ul></section>)}</div></div>;
}
