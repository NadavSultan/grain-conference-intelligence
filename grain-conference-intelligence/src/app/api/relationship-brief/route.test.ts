import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createDemoWorkspace } from "@/data/demo-workspace";
import { PROFILES } from "@/data/prep-snapshots";

const createMock = vi.fn();

vi.mock("openai", () => ({
  default: class OpenAI {
    responses = { create: createMock };
  },
}));

function marcusRequest() {
  const seed = createDemoWorkspace();
  const timeline = seed.timeline.filter((entry) => entry.personId === "marcus");
  return {
    personId: "marcus",
    companyId: "payloom",
    timeline,
    evidence: PROFILES.marcus.evidence.map((item) => ({
      id: item.id,
      personId: item.personId,
      companyId: item.companyId,
    })),
    canDraftEmail: true,
    canDraftLinkedIn: true,
  };
}

function validUnclearBrief() {
  return {
    state: "unclear",
    confidence: 0.41,
    summary: "One actual meeting does not establish warming.",
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
}

describe("POST /api/relationship-brief", () => {
  beforeEach(() => {
    vi.resetModules();
    createMock.mockReset();
    process.env.AI_USAGE_SECRET = "test-usage-secret";
    process.env.OPENAI_MODEL = "gpt-5.4-mini";
    delete process.env.OPENAI_API_KEY;
  });

  afterEach(() => {
    delete process.env.OPENAI_API_KEY;
  });

  it("returns fallback when the OpenAI key is missing", async () => {
    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/relationship-brief", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(marcusRequest()),
      }),
    );
    const payload = await response.json();
    expect(payload.ok).toBe(false);
    expect(payload.code).toBe("missing_key");
    expect(payload.retryable).toBe(false);
    expect(payload.fallback.state).toBe("unclear");
    expect(payload.usageRemaining).toBe(5);
  });

  it("returns fallback when the model output is invalid", async () => {
    process.env.OPENAI_API_KEY = "sk-test";
    createMock.mockResolvedValue({
      output_text: JSON.stringify({ state: "warming", confidence: 9 }),
    });
    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/relationship-brief", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(marcusRequest()),
      }),
    );
    const payload = await response.json();
    expect(payload.ok).toBe(false);
    expect(payload.fallback.state).toBe("unclear");
    expect(payload.fallback.state).not.toBe("warming");
  });

  it("returns a live brief when the model output is valid", async () => {
    process.env.OPENAI_API_KEY = "sk-test";
    createMock.mockResolvedValue({ output_text: JSON.stringify(validUnclearBrief()) });
    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/relationship-brief", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(marcusRequest()),
      }),
    );
    const payload = await response.json();
    expect(payload.ok).toBe(true);
    expect(payload.mode).toBe("live");
    expect(payload.provider).toBe("openai");
    expect(payload.model).toBe("gpt-5.4-mini");
    expect(payload.brief.evidenceEncounterIds).toEqual(["enc-marcus-money20-prior"]);
    expect(payload.usageRemaining).toBe(4);
  });

  it("rejects the sixth live call with usage_exhausted and keeps fallback usable", async () => {
    process.env.OPENAI_API_KEY = "sk-test";
    createMock.mockResolvedValue({ output_text: JSON.stringify(validUnclearBrief()) });
    const { POST } = await import("./route");
    const { signUsageCookie } = await import("@/features/copilot/usage-cookie");
    const exhausted = signUsageCookie(0);
    const response = await POST(
      new Request("http://localhost/api/relationship-brief", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          cookie: `grain-ai-usage=${exhausted}`,
        },
        body: JSON.stringify(marcusRequest()),
      }),
    );
    const payload = await response.json();
    expect(payload.ok).toBe(false);
    expect(payload.code).toBe("usage_exhausted");
    expect(payload.fallback).toBeTruthy();
    expect(createMock).not.toHaveBeenCalled();
  });
});
