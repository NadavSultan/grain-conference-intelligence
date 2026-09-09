"use client";

import { useMemo, useState } from "react";

import type { PrepSnapshot } from "@/domain/types";
import { PREP_SNAPSHOTS } from "@/data/prep-snapshots";
import { RESEARCH_PROGRESS } from "@/features/prep/actions";
import { diffSnapshots, nextCachedSnapshot } from "@/features/prep/selectors";
import { useWorkspace } from "@/workspace/provider";

export function ResearchStatus({
  researchKey,
  snapshot,
  asOf,
}: {
  researchKey: string;
  snapshot: PrepSnapshot;
  asOf: string;
}) {
  const { state, dispatch } = useWorkspace();
  const [step, setStep] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const next = nextCachedSnapshot(snapshot.id, PREP_SNAPSHOTS);
  const simulatedAt = state.simulatedResearchRuns[researchKey] ?? null;
  const stale =
    Date.parse(asOf) - Date.parse(snapshot.researchedAt) > 14 * 86_400_000 &&
    Date.parse(asOf) >= Date.parse(snapshot.researchedAt);
  const previous = useMemo(
    () =>
      PREP_SNAPSHOTS.find(
        (candidate) =>
          candidate.conferenceId === snapshot.conferenceId &&
          candidate.researchedAt < snapshot.researchedAt,
      ),
    [snapshot],
  );

  async function replay() {
    setError(null);
    if (!next) {
      setError("Replay failed. The stored snapshot is unchanged.");
      return;
    }
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduced) {
      for (let index = 0; index < RESEARCH_PROGRESS.length; index += 1) {
        setStep(index);
        await new Promise((resolve) => window.setTimeout(resolve, 180));
      }
    }
    dispatch({
      type: "prep/activate-snapshot",
      conferenceId: researchKey,
      snapshotId: next.id,
      simulatedAt: new Date().toISOString(),
    });
    setStep(null);
  }

  const diff = previous ? diffSnapshots(previous.records, snapshot.records) : null;

  return (
    <section className="workspace-card compact">
      <h2>Research status</h2>
      <p className="provenance">Last researched {snapshot.researchedAt}</p>
      {simulatedAt ? (
        <p className="provenance">
          Simulated replay {simulatedAt}. Stored research time remains {snapshot.researchedAt}.
        </p>
      ) : null}
      {stale ? <p className="demo-warning">This snapshot is older than 14 days.</p> : null}
      <button type="button" className="chip" onClick={() => void replay()} disabled={step !== null}>
        Research again
      </button>
      {step !== null ? <p className="lede">{RESEARCH_PROGRESS[step]}</p> : null}
      {error ? <p className="demo-warning">{error}</p> : null}
      {diff && (simulatedAt || previous) ? (
        <div>
          <p className="lede">Added, changed, and removed/cancelled evidence from stored snapshots.</p>
          <p>Added: {diff.added.join(", ") || "none"}</p>
          <p>Changed: {diff.changed.join(", ") || "none"}</p>
          <p>Removed/cancelled: {diff.removedOrCancelled.join(", ") || "none"}</p>
        </div>
      ) : null}
    </section>
  );
}
