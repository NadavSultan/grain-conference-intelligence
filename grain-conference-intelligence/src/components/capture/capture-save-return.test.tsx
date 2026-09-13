import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CaptureView } from "@/components/capture/capture-view";
import { WorkspaceProvider } from "@/workspace/provider";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/components/capture/voice-capture-panel", () => ({
  VoiceCapturePanel: () => null,
}));

describe("saved scheduled meetings", () => {
  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it("returns to Capture and shows the saved encounter after Save encounter", async () => {
    const user = userEvent.setup();
    render(
      <WorkspaceProvider>
        <CaptureView />
      </WorkspaceProvider>,
    );

    await screen.findByRole("heading", { name: "Scheduled meetings" });
    await user.click(screen.getByRole("button", { name: "Update" }));
    await user.type(screen.getByLabelText("Short note"), "Agreed a corridor walkthrough next Tuesday.");
    await user.click(screen.getByRole("button", { name: "Save encounter" }));

    const captured = await screen.findByRole("region", { name: "Captured encounters" });
    expect(within(captured).getByText("Marcus Oyelaran")).toBeInTheDocument();
    expect(within(captured).getByText("Agreed a corridor walkthrough next Tuesday.")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Update meeting" })).not.toBeInTheDocument();
  });

  it("shows an unplanned saved encounter in the same Capture list", async () => {
    const user = userEvent.setup();
    render(
      <WorkspaceProvider>
        <CaptureView />
      </WorkspaceProvider>,
    );

    await screen.findByRole("heading", { name: "Scheduled meetings" });
    await user.click(screen.getByRole("button", { name: "Update an unplanned meeting" }));
    await user.type(screen.getByLabelText("Name"), "David Cohen");
    await user.type(screen.getByLabelText("Company"), "Northwind Travel");
    await user.type(screen.getByLabelText("Short note"), "Discussed FX protection for THB costs.");
    await user.click(screen.getByRole("button", { name: "Save encounter" }));

    const captured = await screen.findByRole("region", { name: "Captured encounters" });
    expect(within(captured).getByText("David Cohen")).toBeInTheDocument();
    expect(within(captured).getByText("Northwind Travel")).toBeInTheDocument();
    expect(within(captured).getByText("Discussed FX protection for THB costs.")).toBeInTheDocument();
    expect(screen.getByText(/1 captured/)).toBeInTheDocument();
  });

  it("deletes a captured encounter from the list after confirmation", async () => {
    vi.stubGlobal("confirm", vi.fn(() => true));
    const user = userEvent.setup();
    render(
      <WorkspaceProvider>
        <CaptureView />
      </WorkspaceProvider>,
    );

    await screen.findByRole("heading", { name: "Scheduled meetings" });
    await user.click(screen.getByRole("button", { name: "Update an unplanned meeting" }));
    await user.type(screen.getByLabelText("Name"), "Delete Me");
    await user.type(screen.getByLabelText("Company"), "Temporary Company");
    await user.type(screen.getByLabelText("Short note"), "Temporary note.");
    await user.click(screen.getByRole("button", { name: "Save encounter" }));
    await user.click(screen.getByRole("button", { name: "Delete encounter with Delete Me" }));

    expect(screen.queryByRole("region", { name: "Captured encounters" })).not.toBeInTheDocument();
    expect(screen.getByText(/0 captured/)).toBeInTheDocument();
  });
});
