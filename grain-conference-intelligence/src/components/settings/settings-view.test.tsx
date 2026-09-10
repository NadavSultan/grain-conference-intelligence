import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SettingsView } from "@/components/settings/settings-view";
import { IntegrationStatusProvider } from "@/hooks/use-integration-status";

const FAKE_KEY = "test-openai-session-key-aaaa";

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
  useWorkspace: () => ({ resetWorkspace: vi.fn() }),
}));

function jsonResponse(body: unknown, ok = true) {
  return { ok, json: async () => body };
}

function renderSettings() {
  return render(
    <IntegrationStatusProvider>
      <SettingsView />
    </IntegrationStatusProvider>,
  );
}

describe("Settings OpenAI credentials", () => {
  afterEach(() => {
    cleanup();
    sessionStorage.clear();
    localStorage.clear();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("clears the secret input after connect and never persists the key", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ configured: false, source: "none", model: "gpt-5.4-mini" }))
      .mockResolvedValueOnce(jsonResponse({ configured: true, source: "session", model: "gpt-5.4-mini" }));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    renderSettings();

    await waitFor(() => {
      expect(screen.getByText("Not configured")).toBeInTheDocument();
      expect(screen.getByText("Demo mode")).toBeInTheDocument();
    });

    const input = screen.getByLabelText("OpenAI API key");
    expect(input).toHaveAttribute("type", "password");
    expect(input).toHaveAttribute("autoComplete", "off");
    expect(input).toHaveAttribute("spellcheck", "false");

    await user.type(input, FAKE_KEY);
    await user.click(screen.getByRole("button", { name: "Connect" }));

    await waitFor(() => {
      expect(screen.getByText("Session key configured")).toBeInTheDocument();
    });
    expect(input).toHaveValue("");
    expect(sessionStorage.getItem("grain-openai-mode")).toBe("live");
    expect(`${JSON.stringify(sessionStorage)} ${JSON.stringify(localStorage)}`).not.toContain(FAKE_KEY);
    expect(screen.queryByDisplayValue(FAKE_KEY)).not.toBeInTheDocument();
  });

  it("replace and remove stay on the Settings card without showing key material", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ configured: true, source: "session", model: "gpt-5.4-mini" }))
      .mockResolvedValueOnce(jsonResponse({ configured: true, source: "session", model: "gpt-5.4-mini" }))
      .mockResolvedValueOnce({ ok: true, json: async () => ({ configured: false, source: "none" }) })
      .mockResolvedValueOnce(jsonResponse({ configured: false, source: "none", model: "gpt-5.4-mini" }));
    vi.stubGlobal("fetch", fetchMock);
    sessionStorage.setItem("grain-openai-mode", "live");
    const user = userEvent.setup();
    renderSettings();

    await waitFor(() => {
      expect(screen.getByText("Session key configured")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Replace" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Remove" })).toBeInTheDocument();
    });

    const input = screen.getByLabelText("OpenAI API key");
    await user.type(input, FAKE_KEY);
    await user.click(screen.getByRole("button", { name: "Replace" }));
    await waitFor(() => expect(input).toHaveValue(""));

    await user.click(screen.getByRole("button", { name: "Remove" }));
    await waitFor(() => {
      expect(screen.getByText("Not configured")).toBeInTheDocument();
      expect(screen.getByText("Demo mode")).toBeInTheDocument();
    });
    expect(`${JSON.stringify(sessionStorage)} ${JSON.stringify(localStorage)}`).not.toContain(FAKE_KEY);
  });

  it("keeps HubSpot labelled simulated and does not collect a HubSpot key", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ configured: false, source: "none", model: "gpt-5.4-mini" })),
    );
    renderSettings();
    await waitFor(() => expect(screen.getByText("HubSpot")).toBeInTheDocument());
    expect(screen.getByText("Simulated")).toBeInTheDocument();
    expect(screen.queryByLabelText(/hubspot/i)).not.toBeInTheDocument();
    const openaiCard = screen.getByRole("heading", { name: "OpenAI" }).closest("section");
    expect(openaiCard).toBeTruthy();
    expect(
      within(openaiCard as HTMLElement).getByText(
        /Your key is encrypted in a short-lived HttpOnly session cookie/i,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/Enter credentials only on a deployment you trust/i)).toBeInTheDocument();
  });

  it("keeps desktop and mobile Settings layouts usable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ configured: false, source: "none", model: "gpt-5.4-mini" })),
    );
    const { container } = renderSettings();
    await waitFor(() => expect(screen.getByRole("button", { name: "Connect" })).toBeInTheDocument());
    expect(container.querySelector(".settings-openai-card")).toBeTruthy();
    expect(container.querySelector(".settings-side-cards")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Demo Mode" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Live Mode" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reset demo workspace" })).toBeInTheDocument();
  });
});
