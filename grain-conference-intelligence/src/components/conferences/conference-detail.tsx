"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { PlanControls } from "@/components/conferences/plan-controls";
import { ScorePanel, useRecordOriginalScore } from "@/components/conferences/score-panel";
import { audienceSizeLabel, CONFERENCES } from "@/data/conferences";
import { PREP_SNAPSHOTS, PROFILES, type FullProfileId } from "@/data/prep-snapshots";
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
    ? snapshotForConference(conference, PREP_SNAPSHOTS, state.activeSnapshotIds)
    : undefined;
  const score = conference ? calculateConferenceScore(conference, snapshot) : null;
  const plan = getConferencePlan(state.conferencePlans, conferenceId);
  const original = originalScoreFor(state.scoreSnapshots, conferenceId);

  useRecordOriginalScore(conference ? score : null);

  const namedPeople = (snapshot?.records ?? [])
    .filter((record) => record.personId)
    .map((record) => {
      const profile =
        record.personId && record.personId in PROFILES
          ? PROFILES[record.personId as FullProfileId]
          : null;
      return {
        id: record.id,
        personId: record.personId as string,
        name: profile?.name ?? record.personId,
        title: profile?.title ?? record.roleFit,
        company: profile?.company ?? record.companyId,
      };
    });

  if (!conference || !score) {
    return (
      <section className="page-stack">
        <h1>Conference not found</h1>
        <Link href="/conferences">Back to conferences</Link>
      </section>
    );
  }

  return (
    <section className="page-stack" aria-labelledby="conference-title">
      <div>
        <p className="eyebrow">
          {conference.startDate} – {conference.endDate} · {conference.geography} · {conference.vertical}
        </p>
        <h1 id="conference-title">{conference.name}</h1>
        <p className="lede">{conference.location}</p>
        <p className="provenance">
          <a href={conference.sourceUrl} target="_blank" rel="noreferrer">
            Official source
          </a>
          {" · verified "}
          {conference.verifiedAt}
        </p>
      </div>
      <div className="tabs" role="tablist" aria-label="Conference sections">
        <Link
          href={`/conferences/${conference.id}`}
          className={tab === "overview" ? "chip chip-active" : "chip"}
          role="tab"
          aria-selected={tab === "overview"}
        >
          Overview
        </Link>
        <Link
          href={`/conferences/${conference.id}?tab=prep`}
          className={tab === "prep" ? "chip chip-active" : "chip"}
          role="tab"
          aria-selected={tab === "prep"}
        >
          Prep
        </Link>
      </div>
      {tab === "overview" ? (
        <>
          {original && original.snapshotId !== score.snapshotId ? (
            <p className="coverage-warning">
              Original snapshot {original.snapshotId ?? "none"} scored {original.total} (Tier {original.tier})
              and remains stored. The current view uses the active snapshot without replacing that original.
            </p>
          ) : null}
          <ScorePanel
            score={score}
            audienceSizeLabel={audienceSizeLabel(conference)}
            demoWarning={conference.demoDateWarning}
          />
          <PlanControls
            plan={plan}
            recommendation={recommendDecision(score.tier)}
            onDecision={(next) =>
              dispatch({ type: "plan/set-decision", conferenceId: conference.id, decision: next })
            }
            onOwner={(owner) =>
              dispatch({ type: "plan/set-owner", conferenceId: conference.id, owner })
            }
          />
        </>
      ) : (
        <article className="workspace-card compact">
          <h2>Cached Prep</h2>
          <p className="lede">
            Opening this tab does not start research or AI. Only stored snapshots are shown.
          </p>
          {snapshot ? (
            <>
              <p className="provenance">
                Last researched {snapshot.researchedAt}
                {snapshot.simulatedAt ? ` · simulated replay ${snapshot.simulatedAt}` : ""}
                {" · Q "}
                {score.q === null ? "Unknown" : score.q}
              </p>
              <ul className="link-list">
                {namedPeople.map((person) => (
                  <li key={recordKey(person)}>
                    <span>
                      {person.name} · {person.title} · {person.company}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="empty">No cached Prep snapshot exists for this event.</p>
          )}
        </article>
      )}
    </section>
  );
}

function recordKey(person: { id: string }): string {
  return person.id;
}
