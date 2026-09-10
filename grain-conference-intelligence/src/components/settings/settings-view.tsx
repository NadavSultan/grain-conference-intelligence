"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { useIntegrationStatus } from "@/hooks/use-integration-status";
import { useWorkspace } from "@/workspace/provider";

export function SettingsView() {
  const { resetWorkspace } = useWorkspace();
  const live = useIntegrationStatus();
  const liveReady = Boolean(live?.liveConfigured);

  return (
    <section className="page-stack" aria-labelledby="settings-title">
      <PageHeader
        eyebrow="Workspace"
        title="Settings"
        titleId="settings-title"
        description="Demo is the default. Secrets are never entered in the browser. Opening pages does not start research or AI."
      />
      <div className="planning-callouts">
        <Card>
          <div className="badge-row">
            <Badge tone="info">Demo</Badge>
          </div>
          <h2>Mode</h2>
          <p>Demo (default). Fictional fixtures stay locked to Demo mode.</p>
        </Card>
        <Card>
          <div className="badge-row">
            <Badge tone={liveReady ? "success" : "neutral"}>
              {liveReady ? "Live AI" : "Not configured"}
            </Badge>
          </div>
          <h2>OpenAI</h2>
          <p>
            OpenAI live: {live?.liveConfigured ? `Available on the server · ${live.model}` : "Not configured in this environment"}
            . Remaining allowance is reported after an explicit Copilot call (five calls per anonymous browser).
          </p>
        </Card>
        <Card>
          <div className="badge-row">
            <Badge tone="warning">Simulated</Badge>
          </div>
          <h2>HubSpot</h2>
          <p>HubSpot live: Not included in P0.</p>
        </Card>
      </div>
      <Card>
        <h2>What is seeded, simulated, or live</h2>
        <ul>
          <li>Conference scores and Prep lists replay stored snapshots. They do not run live research.</li>
          <li>Outreach pages and evidence cards are labelled fictional demo scenarios.</li>
          <li>Relationship Copilot can call OpenAI only from the server after an explicit click. Missing keys use deterministic fallback plus a cached Marcus example.</li>
          <li>HubSpot is a persisted local simulation. No application action sends email, LinkedIn, Slack, or a real HubSpot write.</li>
          <li>Workspace state is stored in this browser under grain-conference-intelligence:v1 and survives reload.</li>
        </ul>
      </Card>
      <Button onClick={resetWorkspace}>Reset demo workspace</Button>
    </section>
  );
}
