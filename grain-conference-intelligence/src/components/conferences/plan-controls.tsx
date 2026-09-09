"use client";

import type { ConferencePlan, PlanDecision } from "@/domain/types";

const DECISIONS: PlanDecision[] = ["attend", "watch", "skip", "undecided"];

export function PlanControls({
  plan,
  recommendation,
  onDecision,
  onOwner,
}: {
  plan: ConferencePlan;
  recommendation: string;
  onDecision: (decision: PlanDecision) => void;
  onOwner: (owner: string | null) => void;
}) {
  return (
    <section className="plan-controls" aria-labelledby="plan-heading">
      <h2 id="plan-heading">Coverage decision</h2>
      <p className="lede">Suggested from the current snapshot: {recommendation}. Your saved choice stays until you change it.</p>
      <div className="decision-row" role="group" aria-label="Attend, watch, or skip">
        {DECISIONS.map((decision) => (
          <button
            key={decision}
            type="button"
            className={plan.decision === decision ? "chip chip-active" : "chip"}
            onClick={() => onDecision(decision)}
          >
            {decision.replace("_", " ")}
          </button>
        ))}
      </div>
      <label className="field-label">
        Owner
        <input
          value={plan.owner ?? ""}
          onChange={(event) => onOwner(event.target.value.trim() ? event.target.value : null)}
          placeholder="Unassigned"
        />
      </label>
    </section>
  );
}
