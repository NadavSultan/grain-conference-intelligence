"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
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
  const [draftDecision, setDraftDecision] = useState<PlanDecision>(plan.decision);
  const [draftOwner, setDraftOwner] = useState(plan.owner ?? "");
  const [saved, setSaved] = useState(false);
  const dirty = draftDecision !== plan.decision || draftOwner !== (plan.owner ?? "");

  useEffect(() => {
    setDraftDecision(plan.decision);
    setDraftOwner(plan.owner ?? "");
    setSaved(false);
  }, [plan.decision, plan.owner]);

  function saveChanges() {
    onDecision(draftDecision);
    onOwner(draftOwner.trim() ? draftOwner.trim() : null);
    setSaved(true);
  }

  return (
    <section className="plan-controls" aria-labelledby="plan-heading">
      <h2 id="plan-heading">Coverage decision</h2>
      <p className="lede">Suggested from the current snapshot: {recommendation}. Your saved choice stays until you change it.</p>
      <div className="decision-row" role="group" aria-label="Attend, watch, or skip">
        {DECISIONS.map((decision) => (
          <Button
            key={decision}
            className={draftDecision === decision ? "chip chip-active" : "chip"}
            variant={draftDecision === decision ? "primary" : "secondary"}
            onClick={() => {
              setDraftDecision(decision);
              setSaved(false);
            }}
          >
            {decision.replace("_", " ")}
          </Button>
        ))}
      </div>
      <label className="field-label">
        Owner
        <input
          value={draftOwner}
          onChange={(event) => {
            setDraftOwner(event.target.value);
            setSaved(false);
          }}
          placeholder="Unassigned"
        />
      </label>
      <div className="plan-controls-footer">
        <Button variant="primary" onClick={saveChanges} disabled={!dirty}>
          Save changes
        </Button>
        {saved ? <span className="save-confirmation" role="status">Changes saved</span> : null}
      </div>
    </section>
  );
}
