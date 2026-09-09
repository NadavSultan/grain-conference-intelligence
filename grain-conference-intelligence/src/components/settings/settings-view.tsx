"use client";

import { useEffect, useState } from "react";

import { useWorkspace } from "@/workspace/provider";

export function SettingsView() {
  const { resetWorkspace } = useWorkspace();
  const [live, setLive] = useState<{ liveConfigured: boolean; model: string } | null>(null);

  useEffect(() => {
    void fetch("/api/relationship-brief")
      .then((response) => response.json())
      .then((payload) =>
        setLive({
          liveConfigured: Boolean(payload.liveConfigured),
          model: payload.model ?? "gpt-5.4-mini",
        }),
      )
      .catch(() => setLive({ liveConfigured: false, model: "gpt-5.4-mini" }));
  }, []);

  return (
    <section className="page-stack" aria-labelledby="settings-title">
      <p className="eyebrow">Workspace</p>
      <h1 id="settings-title">Settings</h1>
      <p className="lede">
        Demo is the default. Secrets are never entered in the browser. Opening pages does not start
        research or AI.
      </p>
      <section className="workspace-card compact">
        <h2>Mode</h2>
        <p>Demo (default). Fictional fixtures stay locked to Demo mode.</p>
        <p>
          OpenAI live: {live?.liveConfigured ? `Available on the server · ${live.model}` : "Not configured in this environment"}
          . Remaining allowance is reported after an explicit Copilot call (five calls per anonymous browser).
        </p>
        <p>HubSpot live: Not included in P0.</p>
      </section>
      <section className="workspace-card compact">
        <h2>What is seeded, simulated, or live</h2>
        <ul>
          <li>Conference scores and Prep lists replay stored snapshots. They do not run live research.</li>
          <li>Outreach pages and evidence cards are labelled fictional demo scenarios.</li>
          <li>Relationship Copilot can call OpenAI only from the server after an explicit click. Missing keys use deterministic fallback plus a cached Marcus example.</li>
          <li>HubSpot is a persisted local simulation. No application action sends email, LinkedIn, Slack, or a real HubSpot write.</li>
          <li>Workspace state is stored in this browser under grain-conference-intelligence:v1 and survives reload.</li>
        </ul>
      </section>
      <button type="button" className="chip" onClick={resetWorkspace}>
        Reset demo workspace
      </button>
    </section>
  );
}
