"use client";

import { useState, type FormEvent } from "react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonRow } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { useIntegrationStatus } from "@/hooks/use-integration-status";
import { useWorkspace } from "@/workspace/provider";

export function SettingsView() {
  const { resetWorkspace } = useWorkspace();
  const integrations = useIntegrationStatus();
  const [apiKey, setApiKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const mode = integrations?.mode ?? "demo";
  const source = integrations?.source ?? "none";
  const sessionConfigured = source === "session";

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!integrations) return;
    setFormError(null);
    const submitted = apiKey;
    setApiKey("");
    setBusy(true);
    try {
      const ok = await integrations.configure(submitted);
      if (!ok) {
        setFormError("The key could not be saved. Try again on a deployment you trust.");
      }
    } catch {
      setFormError("The key could not be saved. Try again on a deployment you trust.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="page-stack" aria-labelledby="settings-title">
      <PageHeader
        eyebrow="Workspace"
        title="Settings"
        titleId="settings-title"
        description="Demo is the default. Live AI uses a user-configured OpenAI key. Opening pages does not start research or AI."
      />
      <Card className="settings-openai-card">
        <div className="badge-row">
          <Badge tone={mode === "live" ? "blue" : "info"}>{mode === "live" ? "Live mode" : "Demo mode"}</Badge>
          {source === "session" ? <Badge tone="success">Session key configured</Badge> : null}
          {source === "deployment" ? <Badge tone="success">Deployment key available</Badge> : null}
          {source === "none" ? <Badge tone="neutral">Not configured</Badge> : null}
        </div>
        <h2>OpenAI</h2>
        <p>
          Demo mode never calls OpenAI. Live mode uses your session key when present, otherwise a
          deployment key if the host has configured one.
        </p>
        <div className="settings-mode-toggle" role="group" aria-label="OpenAI mode">
          <Button
            variant={mode === "demo" ? "primary" : "secondary"}
            aria-pressed={mode === "demo"}
            onClick={() => integrations?.setMode("demo")}
          >
            Demo Mode
          </Button>
          <Button
            variant={mode === "live" ? "primary" : "secondary"}
            aria-pressed={mode === "live"}
            onClick={() => integrations?.setMode("live")}
          >
            Live Mode
          </Button>
        </div>
        <form className="settings-secret-form" onSubmit={(event) => void onSubmit(event)}>
          <label className="field-label" htmlFor="openai-session-key">
            OpenAI API key
            <input
              id="openai-session-key"
              name="openai-session-key"
              type="password"
              autoComplete="off"
              spellCheck={false}
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              placeholder={sessionConfigured ? "Enter a replacement key" : "Paste your OpenAI API key"}
            />
          </label>
          <ButtonRow>
            <Button variant="primary" type="submit" disabled={busy || !integrations || !apiKey.trim()}>
              {sessionConfigured ? "Replace" : "Connect"}
            </Button>
            {sessionConfigured ? (
              <Button
                variant="danger"
                disabled={busy}
                onClick={() => {
                  setFormError(null);
                  void integrations?.remove();
                }}
              >
                Remove
              </Button>
            ) : null}
          </ButtonRow>
        </form>
        {formError ? <Alert tone="warning">{formError}</Alert> : null}
        <p className="settings-security-copy">
          Your key is encrypted in a short-lived HttpOnly session cookie. It is never stored in the
          workspace, browser storage, source code or application logs.
        </p>
        <Alert tone="warning">
          Enter credentials only on a deployment you trust. A copied key is sent to this origin so it
          can be encrypted server-side.
        </Alert>
        {integrations ? (
          <p>
            {integrations.configured
              ? `OpenAI ${integrations.source === "session" ? "session" : "deployment"} credential is available · ${integrations.model}`
              : "OpenAI is not configured in this environment"}
            . Remaining live allowance is reported after an explicit Copilot call (five calls per
            anonymous browser).
          </p>
        ) : (
          <p>Checking integration status…</p>
        )}
      </Card>
      <div className="settings-side-cards">
        <Card>
          <div className="badge-row">
            <Badge tone="info">Demo</Badge>
          </div>
          <h2>Mode</h2>
          <p>Demo is the default. Fictional fixtures stay locked to Demo data even when Live AI is selected.</p>
        </Card>
        <Card>
          <div className="badge-row">
            <Badge tone="warning">Simulated</Badge>
          </div>
          <h2>HubSpot</h2>
          <p>
            HubSpot remains simulated. No HubSpot credential is collected, and no application action
            sends a real HubSpot write.
          </p>
        </Card>
      </div>
      <Card>
        <h2>What is seeded, simulated, or live</h2>
        <ul>
          <li>Conference scores and Prep lists replay stored snapshots. They do not run live research.</li>
          <li>Outreach pages and evidence cards are labelled fictional demo scenarios.</li>
          <li>
            Relationship Copilot can call OpenAI only from the server after an explicit click, and only
            in Live mode with a configured key. Demo mode returns a labelled deterministic brief.
          </li>
          <li>HubSpot is a persisted local simulation. No application action sends email, LinkedIn, Slack, or a real HubSpot write.</li>
          <li>Workspace state is stored in this browser under grain-conference-intelligence:v1 and survives reload.</li>
        </ul>
      </Card>
      <Button onClick={resetWorkspace}>Reset demo workspace</Button>
    </section>
  );
}
