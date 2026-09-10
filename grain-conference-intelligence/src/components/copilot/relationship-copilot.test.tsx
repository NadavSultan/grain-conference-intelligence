import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RelationshipCopilot, copilotUserNotice } from "@/components/copilot/relationship-copilot";
import { IntegrationStatusProvider } from "@/hooks/use-integration-status";
import { WorkspaceProvider } from "@/workspace/provider";

vi.mock("next/link", () => ({
  default({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  },
}));

const FAKE_KEY = "test-openai-session-key-aaaa";

const demoBrief = {
  state: "unclear",
  confidence: 0.4,
  summary: "Deterministic demo brief for Marcus.",
  evidenceEncounterIds: ["enc-marcus-money20-prior"],
  evidenceSignalIds: ["marcus-speaker-current"],
  suggestedAngle: {
    fact: "Marcus is listed as a current-edition speaker.",
    evidenceIds: ["marcus-speaker-current"],
    relevanceInference: "Attendance is context, not buying progression.",
  },
  counterEvidence: ["Public activity is context, not a meeting or reciprocal commitment."],
  recommendedAction: "Ask whether new corridors changed FX handling?",
  followUpDraft: null,
  linkedInDraft: null,
};

function jsonResponse(body: unknown, ok = true) {
  return { ok, json: async () => body };
}

function mockApis(brief: unknown, briefOk = true) {
  return vi.fn(async (...args: [input: RequestInfo | URL, init?: RequestInit]) => {
    const url = String(args[0]);
    if (url.includes("/api/integrations/openai")) {
      return jsonResponse({ configured: false, source: "none", model: "gpt-5.4-mini" });
    }
    return jsonResponse(brief, briefOk);
  });
}

function renderCopilot() {
  return render(
    <WorkspaceProvider>
      <IntegrationStatusProvider>
        <RelationshipCopilot personId="marcus" companyId="payloom" />
      </IntegrationStatusProvider>
    </WorkspaceProvider>,
  );
}

async function generateBrief(user: ReturnType<typeof userEvent.setup>) {
  const button = await screen.findByRole("button", { name: "Generate relationship brief" });
  await waitFor(() => expect(button).toBeEnabled());
  await user.click(button);
}

describe("Relationship Copilot credential states", () => {
  afterEach(() => {
    cleanup();
    sessionStorage.clear();
    localStorage.clear();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("shows a demo-generated label, not an error", async () => {
    const fetchMock = mockApis({
      ok: true,
      mode: "demo",
      brief: demoBrief,
      provider: "deterministic-demo",
      model: "none",
      generatedAt: "2026-09-10T12:00:00.000Z",
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    renderCopilot();

    await generateBrief(user);

    await waitFor(() => {
      expect(screen.getByText("Demo-generated deterministic brief")).toBeInTheDocument();
    });
    expect(screen.queryByText(/missing_key/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Returned /)).not.toBeInTheDocument();
    const post = fetchMock.mock.calls.find((call) => String(call[0]).includes("/api/relationship-brief"));
    expect(JSON.parse(String((post?.[1] as RequestInit | undefined)?.body))).toMatchObject({ mode: "demo" });
    expect(JSON.stringify(post)).not.toContain(FAKE_KEY);
  });

  it("shows Live AI, OpenAI, model and generation time on live success", async () => {
    sessionStorage.setItem("grain-openai-mode", "live");
    const fetchMock = mockApis({
      ok: true,
      mode: "live",
      brief: demoBrief,
      provider: "openai",
      model: "gpt-5.4-mini",
      generatedAt: "2026-09-10T15:30:00.000Z",
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    renderCopilot();

    await generateBrief(user);

    await waitFor(() => {
      expect(
        screen.getByText("Live AI · OpenAI · gpt-5.4-mini · 2026-09-10T15:30:00.000Z"),
      ).toBeInTheDocument();
    });
    const post = fetchMock.mock.calls.find((call) => String(call[0]).includes("/api/relationship-brief"));
    expect(JSON.parse(String((post?.[1] as RequestInit | undefined)?.body))).toMatchObject({ mode: "live" });
  });

  it.each([
    [
      "not_configured",
      "Live AI is not configured. Add an OpenAI API key in Settings.",
      true,
    ],
    [
      "invalid_credentials",
      "The configured OpenAI key was rejected. Replace it in Settings.",
      true,
    ],
    [
      "usage_exhausted",
      "This browser has used its live AI allowance. Showing the safe demo brief.",
      false,
    ],
    [
      "provider_error",
      "OpenAI is temporarily unavailable. Showing the safe demo brief.",
      false,
    ],
    ["invalid_request", "The brief request was invalid. Showing the safe demo brief.", false],
    ["invalid_schema", "Live AI returned an unusable brief. Showing the safe demo brief.", false],
    [
      "unsupported_evidence",
      "Live AI cited evidence that is not allowed. Showing the safe demo brief.",
      false,
    ],
  ] as const)("maps %s to friendly copy", async (code, message, settingsLink) => {
    sessionStorage.setItem("grain-openai-mode", "live");
    vi.stubGlobal(
      "fetch",
      mockApis({ ok: false, code, fallback: demoBrief }, false),
    );
    const user = userEvent.setup();
    renderCopilot();
    await generateBrief(user);

    await waitFor(() => {
      expect(screen.getByText(message)).toBeInTheDocument();
      expect(screen.getByText(/Deterministic fallback/)).toBeInTheDocument();
    });
    expect(screen.queryByText(code)).not.toBeInTheDocument();
    expect(screen.queryByText("missing_key")).not.toBeInTheDocument();
    if (settingsLink) {
      expect(screen.getByRole("link", { name: "Open Settings" })).toHaveAttribute("href", "/settings");
    } else {
      expect(screen.queryByRole("link", { name: "Open Settings" })).not.toBeInTheDocument();
    }
  });

  it("never surfaces missing_key as user-visible copy", () => {
    expect(copilotUserNotice("missing_key").message).toBe(
      "Live AI is not configured. Add an OpenAI API key in Settings.",
    );
    expect(copilotUserNotice("missing_key").message).not.toContain("missing_key");
  });
});
