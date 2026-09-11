import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { createDemoWorkspace } from "@/data/demo-workspace";
import { EMPTY_EXTRACTION } from "@/features/capture/voice-extraction";
import type { VoiceCaptureResult } from "@/hooks/use-voice-capture";

const { dispatchMock, panelResult } = vi.hoisted(() => ({
  dispatchMock: vi.fn(),
  panelResult: { current: null as VoiceCaptureResult | null },
}));

vi.mock("@/workspace/provider", () => ({
  useWorkspace: () => ({ state: createDemoWorkspace(), dispatch: dispatchMock }),
}));

// Stands in for microphone + the two API routes: pressing the button delivers
// whatever extraction the test staged, exercising the form's own discipline.
vi.mock("@/components/capture/voice-capture-panel", () => ({
  VoiceCapturePanel: ({ onResult }: { onResult: (result: VoiceCaptureResult) => void }) => (
    <button type="button" onClick={() => panelResult.current && onResult(panelResult.current)}>
      Record
    </button>
  ),
}));

const { CaptureView } = await import("./capture-view");

function stage(extraction: Partial<typeof EMPTY_EXTRACTION>) {
  const full = { ...EMPTY_EXTRACTION, ...extraction };
  panelResult.current = {
    transcript: "staged",
    extraction: full,
    filled: (Object.keys(full) as (keyof typeof full)[]).filter((key) => full[key].length > 0),
  };
}

async function openUnplannedForm(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /capture unplanned meeting/i }));
}

beforeEach(() => {
  dispatchMock.mockReset();
  panelResult.current = null;
});

afterEach(() => {
  cleanup();
});

describe("CaptureView voice fill", () => {
  it("fills every spoken field into the form", async () => {
    const user = userEvent.setup();
    render(<CaptureView />);
    await openUnplannedForm(user);

    stage({
      name: "Marcus Oyelaran",
      company: "Northwind Payments",
      role: "VP Treasury",
      note: "EUR/USD exposure on the Brazil corridor",
      nextStep: "Send demo times next week",
      linkedIn: "https://linkedin.com/in/marcus",
    });
    await user.click(screen.getByRole("button", { name: "Record" }));

    expect(screen.getByLabelText(/^Name/)).toHaveValue("Marcus Oyelaran");
    expect(screen.getByLabelText(/^Company/)).toHaveValue("Northwind Payments");
    expect(screen.getByLabelText(/Role/)).toHaveValue("VP Treasury");
    expect(screen.getByLabelText(/Short note/)).toHaveValue("EUR/USD exposure on the Brazil corridor");
    expect(screen.getByLabelText(/Next step/)).toHaveValue("Send demo times next week");
    expect(screen.getByLabelText(/LinkedIn/)).toHaveValue("https://linkedin.com/in/marcus");
  });

  it("does not invent a conference or a date from speech", async () => {
    const user = userEvent.setup();
    render(<CaptureView />);
    await openUnplannedForm(user);
    stage({ name: "Marcus Oyelaran", company: "Northwind", note: "FX" });
    await user.click(screen.getByRole("button", { name: "Record" }));

    await user.click(screen.getByRole("button", { name: /save encounter/i }));
    expect(dispatchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "capture/save",
        conferenceId: "money20-eu-demo",
        occurredAt: "2026-06-03T12:00:00.000Z",
      }),
    );
  });
});

describe("CaptureView spoken email disclaimer", () => {
  async function speakAnEmail(user: ReturnType<typeof userEvent.setup>) {
    render(<CaptureView />);
    await openUnplannedForm(user);
    stage({
      name: "Marcus Oyelaran",
      company: "Northwind Payments",
      note: "FX exposure",
      email: "marcus@northwind.com",
    });
    await user.click(screen.getByRole("button", { name: "Record" }));
  }

  it("shows the confirmation disclaimer for a spoken address", async () => {
    const user = userEvent.setup();
    await speakAnEmail(user);
    expect(screen.getByText(/a spoken address is not verified/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Verified email/)).toHaveValue("marcus@northwind.com");
  });

  it("withholds the address from the saved encounter until it is confirmed", async () => {
    const user = userEvent.setup();
    await speakAnEmail(user);
    await user.click(screen.getByRole("button", { name: /save encounter/i }));

    expect(dispatchMock).toHaveBeenCalledWith(
      expect.objectContaining({ type: "capture/save", name: "Marcus Oyelaran" }),
    );
    expect(dispatchMock.mock.calls[0][0].email).toBeUndefined();
  });

  it("saves the address once the rep confirms it", async () => {
    const user = userEvent.setup();
    await speakAnEmail(user);
    await user.click(screen.getByRole("button", { name: /confirm this is the email/i }));
    expect(screen.queryByText(/a spoken address is not verified/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /save encounter/i }));
    expect(dispatchMock.mock.calls[0][0].email).toBe("marcus@northwind.com");
  });

  it("clears the address when the rep discards it", async () => {
    const user = userEvent.setup();
    await speakAnEmail(user);
    await user.click(screen.getByRole("button", { name: /discard it/i }));

    expect(screen.getByLabelText(/Verified email/)).toHaveValue("");
    await user.click(screen.getByRole("button", { name: /save encounter/i }));
    expect(dispatchMock.mock.calls[0][0].email).toBeUndefined();
  });

  it("treats a typed address as the rep's own, with no disclaimer", async () => {
    const user = userEvent.setup();
    render(<CaptureView />);
    await openUnplannedForm(user);
    stage({ name: "Marcus Oyelaran", company: "Northwind Payments", note: "FX exposure" });
    await user.click(screen.getByRole("button", { name: "Record" }));

    await user.type(screen.getByLabelText(/Verified email/), "typed@northwind.com");
    expect(screen.queryByText(/a spoken address is not verified/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /save encounter/i }));
    expect(dispatchMock.mock.calls[0][0].email).toBe("typed@northwind.com");
  });
});
