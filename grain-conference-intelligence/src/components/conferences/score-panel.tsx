"use client";

import { useEffect } from "react";
import { Plane } from "lucide-react";

import { Badge, tierTone } from "@/components/ui/badge";
import type { ConferenceScoreResult } from "@/domain/types";
import { useWorkspace } from "@/workspace/provider";

export function useRecordOriginalScore(score: ConferenceScoreResult | null) {
  const { dispatch } = useWorkspace();
  const conferenceId = score?.conferenceId ?? null;
  const snapshotId = score?.snapshotId ?? null;

  useEffect(() => {
    if (!score) return;
    dispatch({ type: "score/record-snapshot", score });
  }, [conferenceId, dispatch, score, snapshotId]);
}

export const COMPONENT_LABELS = {
  vertical_fit: "ICP vertical fit",
  buyer_role_density: "Buyer-role density",
  fx_relevance: "FX / cross-border relevance",
  meeting_accessibility: "Meeting accessibility",
  trip_efficiency: "Trip efficiency",
} as const;

export function ScorePanel({
  score,
  audienceSizeLabel,
  conferenceStartDate,
}: {
  score: ConferenceScoreResult;
  audienceSizeLabel: string;
  conferenceStartDate: string;
}) {
  return (
    <section className="score-panel" aria-labelledby="score-heading" data-tier={score.tier}>
      <div className="score-hero">
        <div>
          <p className="eyebrow">Explainable score snapshot</p>
          <h2 id="score-heading">
            {score.total} / 100 · Tier {score.tier}
          </h2>
          <div className="score-hero-badges badge-row">
            <Badge tone={tierTone(score.tier)}>Tier {score.tier}</Badge>
            <Badge tone="info">Cached snapshot</Badge>
          </div>
          <p className="lede">
            Suggested plan: {score.tier === "A" ? "Attend" : score.tier === "B" ? "Watch" : "Skip"}.
          </p>
          <p className="recommended-departure">
            <Plane aria-hidden="true" size={14} />
            <strong>Recommended departure:</strong> {recommendedDeparture(conferenceStartDate)}
          </p>
        </div>
        <dl className="score-meta">
          <div>
            <dt>Q</dt>
            <dd>{score.q === null ? "Unknown" : score.q}</dd>
          </div>
          <div>
            <dt>Room points</dt>
            <dd>
              {score.researchedRoomPoints}
              {score.researchedRoomStatus === "unknown" ? " · Unknown" : ""}
            </dd>
          </div>
          <div>
            <dt>Research time</dt>
            <dd>{score.researchedAt ? score.researchedAt.slice(0, 10) : "Unknown"}</dd>
          </div>
          <div>
            <dt>Audience size</dt>
            <dd>{audienceSizeLabel}</dd>
          </div>
        </dl>
      </div>
      <ul className="score-bars">
        {score.components.map((component) => (
          <li key={component.component}>
            <div className="score-bar-header">
              <strong>{COMPONENT_LABELS[component.component]}</strong>
              <span>
                {component.points}/{component.max}
                {component.status === "unknown" ? " · Unknown" : ""}
              </span>
            </div>
            <div className="score-bar-track" aria-hidden="true">
              <span
                className={
                  component.status === "unknown" ? "score-bar-fill unknown" : "score-bar-fill"
                }
                style={{ width: `${(component.points / component.max) * 100}%` }}
              />
            </div>
            <p className="rationale">{component.rationale}</p>
            <p className="provenance">
              <a href={component.sourceUrl} target="_blank" rel="noreferrer">
                Source
              </a>
              {" · verified "}
              {component.verifiedAt}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function recommendedDeparture(startDate: string): string {
  const departure = new Date(`${startDate}T00:00:00Z`);
  departure.setUTCDate(departure.getUTCDate() - 1);
  const label = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(departure);
  return `${label} — 1 day before conference start`;
}
