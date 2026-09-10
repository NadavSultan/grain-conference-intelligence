import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ResearchStatus } from "@/components/prep/research-status";
import { createDemoWorkspace } from "@/data/demo-workspace";
import { PREP_SNAPSHOTS } from "@/data/prep-snapshots";
import { useWorkspace } from "@/workspace/provider";

vi.mock("@/workspace/provider", () => ({
  useWorkspace: vi.fn(),
}));

const dispatch = vi.fn();

function snapshot(id: string) {
  const result = PREP_SNAPSHOTS.find((candidate) => candidate.id === id);
  if (!result) throw new Error(`Missing test snapshot: ${id}`);
  return result;
}

function stubReducedMotion(matches: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockReturnValue({
      matches,
      media: "(prefers-reduced-motion: reduce)",
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  );
}

describe("ResearchStatus cached replay", () => {
  beforeEach(() => {
    dispatch.mockReset();
    vi.mocked(useWorkspace).mockReturnValue({
      state: createDemoWorkspace(),
      hydrated: true,
      dispatch,
      resetWorkspace: vi.fn(),
    });
    stubReducedMotion(true);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("disables replay at the latest cached snapshot and explains the expected terminal state neutrally", () => {
    const latest = snapshot("money20-eu-demo-snapshot-2");
    const { container } = render(
      <ResearchStatus researchKey="money20-eu-demo" snapshot={latest} asOf={latest.researchedAt} />,
    );

    expect(screen.getByRole("button", { name: "Replay cached update" })).toBeDisabled();
    expect(screen.getByText("No newer cached snapshot available.")).toBeInTheDocument();
    expect(screen.queryByText("Replay failed. The stored snapshot is unchanged.")).not.toBeInTheDocument();
    expect(container.querySelector(".ui-alert-warning, .ui-alert-danger")).toBeNull();
  });

  it("activates the known successor immediately under reduced motion without scheduling timers", () => {
    const current = snapshot("money20-eu-demo-snapshot-1");
    render(
      <ResearchStatus researchKey="money20-eu-demo" snapshot={current} asOf={current.researchedAt} />,
    );
    const setTimeoutSpy = vi.spyOn(window, "setTimeout");

    const replay = screen.getByRole("button", { name: "Replay cached update" });
    expect(replay).toBeEnabled();
    fireEvent.click(replay);

    expect(setTimeoutSpy).not.toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith({
      type: "prep/activate-snapshot",
      conferenceId: "money20-eu-demo",
      snapshotId: "money20-eu-demo-snapshot-2",
      simulatedAt: expect.any(String),
    });
  });

  it("preserves cached and simulated provenance, stale warning, timestamp separation, and snapshot diff", () => {
    const latest = snapshot("money20-eu-demo-snapshot-2");
    const simulatedAt = "2026-06-12T10:00:00.000Z";
    vi.mocked(useWorkspace).mockReturnValue({
      state: {
        ...createDemoWorkspace(),
        simulatedResearchRuns: { "money20-eu-demo": simulatedAt },
      },
      hydrated: true,
      dispatch,
      resetWorkspace: vi.fn(),
    });

    render(
      <ResearchStatus
        researchKey="money20-eu-demo"
        snapshot={latest}
        asOf="2026-06-12T10:00:00.000Z"
      />,
    );

    expect(screen.getByText("Cached")).toBeInTheDocument();
    expect(screen.getByText("Simulated")).toBeInTheDocument();
    expect(screen.getByText(`Last researched ${latest.researchedAt}`)).toBeInTheDocument();
    expect(
      screen.getByText(
        `Simulated replay ${simulatedAt}. Stored research time remains ${latest.researchedAt}.`,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("This snapshot is older than 14 days.")).toBeInTheDocument();
    expect(
      screen.getByText("Added, changed, and removed/cancelled evidence from stored snapshots."),
    ).toBeInTheDocument();
    expect(screen.getByText("Added: money-company-only")).toBeInTheDocument();
    expect(screen.getByText("Changed: money-edge-changed")).toBeInTheDocument();
    expect(screen.getByText("Removed/cancelled: money-edge-cancelled")).toBeInTheDocument();
  });
});
