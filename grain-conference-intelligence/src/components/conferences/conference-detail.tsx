"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { useSearchParams } from "next/navigation";

import { PlanControls } from "@/components/conferences/plan-controls";
import { ScorePanel, useRecordOriginalScore } from "@/components/conferences/score-panel";
import { PrepList } from "@/components/prep/prep-list";
import { Alert } from "@/components/ui/alert";
import { Badge, decisionTone, humanizeToken, tierTone } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { audienceSizeLabel, CONFERENCES } from "@/data/conferences";
import { PREP_SNAPSHOTS } from "@/data/prep-snapshots";
import { getConferencePlan } from "@/features/conferences/planning";
import {
  calculateConferenceScore,
  originalScoreFor,
  recommendDecision,
  snapshotForConference,
} from "@/features/conferences/scoring";
import { useWorkspace } from "@/workspace/provider";

export function ConferenceDetail({ conferenceId }: { conferenceId: string }) {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") === "prep" ? "prep" : "overview";
  const { state, dispatch } = useWorkspace();
  const conference = CONFERENCES.find((item) => item.id === conferenceId);

  const snapshot = conference
    ? snapshotForConference(conference, PREP_SNAPSHOTS, state.activeSnapshotIds) ??
      (conference.id === "money20-middle-east-2026"
        ? PREP_SNAPSHOTS.find((candidate) => candidate.conferenceId === "money20-eu-demo")
        : undefined)
    : undefined;
  const score = conference ? calculateConferenceScore(conference, snapshot) : null;
  const plan = getConferencePlan(state.conferencePlans, conferenceId);
  const original = originalScoreFor(state.scoreSnapshots, conferenceId);

  useRecordOriginalScore(conference ? score : null);

  if (!conference || !score) {
    return (
      <section className="page-stack">
        <h1>Conference not found</h1>
        <Link href="/conferences">Back to conferences</Link>
      </section>
    );
  }

  const recommendation = recommendDecision(score.tier);

  return (
    <section className="page-stack" aria-labelledby="conference-title">
      <PageHeader
        breadcrumbs={[
          { href: "/conferences", label: "Conferences" },
          { label: conference.name },
        ]}
        title={conference.name}
        titleId="conference-title"
        description={`${conference.startDate} – ${conference.endDate} · ${conference.geography} · ${conference.vertical}`}
        actions={
          <>
            <Link href={`/conferences/${conference.id}/brief`} className={buttonClassName("secondary")}>
              Export brief
            </Link>
            <a
              href={conference.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className={buttonClassName("secondary")}
            >
              Official source
              <ExternalLink size={14} aria-hidden="true" />
            </a>
          </>
        }
        tabs={
          <div className="sticky-tabs" role="tablist" aria-label="Conference sections">
            <Link
              href={`/conferences/${conference.id}`}
              className={tab === "overview" ? "tab-link tab-link-active" : "tab-link"}
              role="tab"
              aria-selected={tab === "overview"}
            >
              Overview
            </Link>
            <Link
              href={`/conferences/${conference.id}?tab=prep`}
              className={tab === "prep" ? "tab-link tab-link-active" : "tab-link"}
              role="tab"
              aria-selected={tab === "prep"}
            >
              Prep
            </Link>
          </div>
        }
      />
      <div className="event-header">
        <div>
          <div className="badge-row">
            <Badge tone={tierTone(score.tier)}>Tier {score.tier}</Badge>
            <Badge tone={decisionTone(plan.decision)}>{humanizeToken(plan.decision)}</Badge>
            <Badge tone="blue">{conference.geography}</Badge>
            <Badge>{conference.vertical}</Badge>
          </div>
          <p className="lede">{conference.location}</p>
          <p className="provenance">
            <a href={conference.sourceUrl} target="_blank" rel="noreferrer">
              Official source
            </a>
            {" · verified "}
            {conference.verifiedAt}
          </p>
        </div>
        <div className="event-score">
          <p className="metric-label">Recommendation score</p>
          <p className="score-number">{score.total}</p>
          <p>
            Tier {score.tier} · {recommendation}
          </p>
        </div>
      </div>
      {tab === "overview" ? (
        <>
          {original && original.snapshotId !== score.snapshotId ? (
            <Alert>
              Original snapshot {original.snapshotId ?? "none"} scored {original.total} (Tier {original.tier})
              and remains stored. The current view uses the active snapshot without replacing that original.
            </Alert>
          ) : null}
          <ScorePanel
            score={score}
            audienceSizeLabel={audienceSizeLabel(conference)}
            demoWarning={conference.demoDateWarning}
          />
          <PlanControls
            plan={plan}
            recommendation={recommendation}
            onDecision={(next) =>
              dispatch({ type: "plan/set-decision", conferenceId: conference.id, decision: next })
            }
            onOwner={(owner) =>
              dispatch({ type: "plan/set-owner", conferenceId: conference.id, owner })
            }
          />
        </>
      ) : snapshot ? (
        <>
          <PrepList
            conferenceId={conference.id}
            researchKey={snapshot.conferenceId}
            snapshot={snapshot}
            previous={PREP_SNAPSHOTS.find(
              (candidate) =>
                candidate.conferenceId === snapshot.conferenceId &&
                candidate.researchedAt < snapshot.researchedAt,
            ) ?? PREP_SNAPSHOTS.find((candidate) => candidate.conferenceId === "money20-eu-demo" && candidate.researchedAt < snapshot.researchedAt)}
            prepStatuses={state.prepStatuses}
          />
        </>
      ) : (
        <EmptyState title="No cached Prep snapshot exists for this event. Opening this tab does not start research." />
      )}
    </section>
  );
}
