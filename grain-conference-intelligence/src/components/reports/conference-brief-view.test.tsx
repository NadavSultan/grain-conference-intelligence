import { readFileSync } from "node:fs";
import path from "node:path";

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ConferenceDetail } from "@/components/conferences/conference-detail";
import { ConferenceBriefView } from "@/components/reports/conference-brief-view";
import { createDemoWorkspace } from "@/data/demo-workspace";
import { CACHED_MARCUS_BRIEF } from "@/features/copilot/cached-marcus";
import type { StoredCopilotBrief } from "@/domain/types";
import { useWorkspace } from "@/workspace/provider";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

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

vi.mock("@/workspace/provider", () => ({
  useWorkspace: vi.fn(),
}));

const dispatch = vi.fn();

function stubWorkspace(state = createDemoWorkspace()) {
  vi.mocked(useWorkspace).mockReturnValue({
    state,
    hydrated: true,
    dispatch,
    resetWorkspace: vi.fn(),
  });
}

describe("ConferenceBriefView", () => {
  beforeEach(() => {
    dispatch.mockReset();
    stubWorkspace();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders the seeded Money20/20 Europe report with score, plan, Prep, meetings, and outreach", () => {
    render(<ConferenceBriefView conferenceId="money20-europe-2027" />);

    expect(screen.getByRole("heading", { name: "Money20/20 Europe" })).toBeInTheDocument();
    expect(screen.getByText("2027-06-08 – 2027-06-10")).toBeInTheDocument();
    expect(screen.getByText("The RAI, Amsterdam, Netherlands")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Official source" })).toHaveAttribute(
      "href",
      "https://europe.money2020.com/attend",
    );

    expect(screen.getByText("83")).toBeInTheDocument();
    expect(screen.getAllByText(/Tier A/).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Attend").length).toBeGreaterThan(0);
    expect(screen.getByText("Undecided")).toBeInTheDocument();
    expect(screen.getByText("Unassigned")).toBeInTheDocument();

    expect(screen.getByText("6")).toBeInTheDocument();
    expect(screen.getByText("Attendees verified")).toBeInTheDocument();
    expect(screen.getByText("Relevant")).toBeInTheDocument();
    expect(screen.getByText("Ready to contact")).toBeInTheDocument();
    expect(screen.getByText("Need coordination")).toBeInTheDocument();

    const contacts = screen.getAllByTestId("brief-priority-contact").map((node) => node.textContent);
    expect(contacts).toHaveLength(4);
    expect(contacts[0]).toContain("David Cohen");
    expect(contacts[1]).toContain("Marcus Oyelaran");
    expect(contacts[2]).toContain("Sam Jones");
    expect(contacts[3]).toContain("Priya Natarajan");
    expect(contacts.join(" ")).toMatch(/To contact/i);
    expect(contacts.join(" ")).not.toContain("edge-changed");
    expect(contacts.every((text) => text?.includes("Fictional demo scenario"))).toBe(true);

    expect(screen.getAllByText("Marcus Oyelaran").length).toBeGreaterThan(0);
    expect(
      screen.getByText("Planned second encounter after the illustrative fireside chat."),
    ).toBeInTheDocument();
    expect(screen.getByText(/illustrative 2–4 June/)).toBeInTheDocument();
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("shows saved Copilot recommendations and an honest empty state when none are saved", () => {
    render(<ConferenceBriefView conferenceId="money20-europe-2027" />);
    expect(screen.getAllByText("No saved brief.").length).toBeGreaterThan(0);
    expect(screen.queryByText(CACHED_MARCUS_BRIEF.recommendedAction)).not.toBeInTheDocument();

    cleanup();
    const stored: StoredCopilotBrief = {
      personId: "marcus",
      mode: "demo",
      provider: "deterministic-demo",
      model: "none",
      generatedAt: "2026-05-20T09:00:00.000Z",
      brief: CACHED_MARCUS_BRIEF,
    };
    stubWorkspace({
      ...createDemoWorkspace(),
      copilotBriefs: { marcus: stored },
    });
    render(<ConferenceBriefView conferenceId="money20-europe-2027" />);

    expect(screen.getByText(CACHED_MARCUS_BRIEF.recommendedAction)).toBeInTheDocument();
    expect(screen.getByText(CACHED_MARCUS_BRIEF.summary)).toBeInTheDocument();
    expect(screen.getAllByText("No saved brief.").length).toBeGreaterThan(0);
  });

  it("renders a valid report for a conference without Prep data and does not fabricate counts", () => {
    render(<ConferenceBriefView conferenceId="money20-usa-2026" />);

    expect(screen.getByRole("heading", { name: "Money20/20 USA" })).toBeInTheDocument();
    expect(screen.getAllByText("Attend").length).toBeGreaterThan(0);
    expect(screen.getByText("Nadav")).toBeInTheDocument();
    expect(screen.getByTestId("brief-prep-verified")).toHaveTextContent("Unknown");
    expect(screen.getByTestId("brief-prep-relevant")).toHaveTextContent("Unknown");
    expect(screen.getByTestId("brief-prep-ready")).toHaveTextContent("Unknown");
    expect(screen.getByTestId("brief-prep-coordination")).toHaveTextContent("Unknown");
    expect(screen.getByText("No cached Prep snapshot exists for this event.")).toBeInTheDocument();
    expect(screen.getByText("No planned meetings.")).toBeInTheDocument();
    expect(screen.queryByTestId("brief-priority-contact")).not.toBeInTheDocument();
  });

  it("reuses the existing not-found behavior for unknown conference IDs", () => {
    render(<ConferenceBriefView conferenceId="missing-conference" />);

    expect(screen.getByRole("heading", { name: "Conference not found" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to conferences" })).toHaveAttribute("href", "/conferences");
  });

  it("invokes window.print from Print / Save PDF and links back to the conference", async () => {
    const print = vi.spyOn(window, "print").mockImplementation(() => undefined);
    const user = userEvent.setup();
    render(<ConferenceBriefView conferenceId="money20-europe-2027" />);

    await user.click(screen.getByRole("button", { name: "Print / Save PDF" }));
    expect(print).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("link", { name: "Back to conference" })).toHaveAttribute(
      "href",
      "/conferences/money20-europe-2027",
    );
  });

  it("marks interactive report actions as print-hidden", () => {
    const { container } = render(<ConferenceBriefView conferenceId="money20-europe-2027" />);
    expect(container.querySelector(".report-actions")).toHaveClass("no-print");
  });

  it("keeps the attendance clarification beside Prep summary and visible in print", () => {
    render(<ConferenceBriefView conferenceId="money20-europe-2027" />);
    const note = screen.getByTestId("brief-attendance-clarification");
    expect(note).toHaveTextContent("Public signals, including likely attendance; not verified check-ins.");
    expect(note).not.toHaveClass("no-print");
    expect(note.closest(".no-print, .report-actions, .brief-toolbar, .page-header-actions")).toBeNull();
  });
});

describe("Export brief entry point", () => {
  beforeEach(() => {
    dispatch.mockReset();
    stubWorkspace();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("navigates from the conference header to the conference report", () => {
    render(<ConferenceDetail conferenceId="money20-europe-2027" />);
    expect(screen.getByRole("link", { name: "Export brief" })).toHaveAttribute(
      "href",
      "/conferences/money20-europe-2027/brief",
    );
  });
});

describe("print stylesheet", () => {
  it("hides application chrome and interactive actions when printing", () => {
    const css = readFileSync(
      path.join(process.cwd(), "src/app/globals.css"),
      "utf8",
    );
    expect(css).toMatch(/@media print/);
    expect(css).toMatch(/\.sidebar/);
    expect(css).toMatch(/\.mobile-header/);
    expect(css).toMatch(/\.mobile-bottom-nav/);
    expect(css).toMatch(/\.report-actions/);
    expect(css).toMatch(/\.no-print/);
    expect(css).toMatch(/size:\s*A4/);
  });

  it("does not hide the attendance clarification in print CSS", () => {
    const css = readFileSync(path.join(process.cwd(), "src/app/globals.css"), "utf8");
    const printBlock = css.split("@media print")[1] ?? "";
    expect(printBlock).toMatch(/\.no-print/);
    expect(printBlock).not.toMatch(/brief-attendance-clarification/);
    expect(printBlock).not.toMatch(/brief-attendance-note/);
  });
});
