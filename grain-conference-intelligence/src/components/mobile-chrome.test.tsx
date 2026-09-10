import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MobileBottomNav, MobileHeader } from "@/components/mobile-chrome";
import { IntegrationStatusProvider } from "@/hooks/use-integration-status";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
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

function renderShell() {
  return render(
    <IntegrationStatusProvider>
      <div className="app-frame">
        <aside className="sidebar">Sidebar</aside>
        <div className="workspace">
          <MobileHeader />
          <div className="workspace-body">
            <a href="/planning">Background planning</a>
          </div>
          <MobileBottomNav />
        </div>
      </div>
    </IntegrationStatusProvider>,
  );
}

describe("mobile navigation drawer", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ liveConfigured: false, model: "gpt-5.4-mini" }),
      }),
    );
    document.documentElement.style.overflow = "";
    document.body.style.overflow = "";
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    document.documentElement.style.overflow = "";
    document.body.style.overflow = "";
  });

  it("moves focus to Close, traps Tab, restores focus on Escape, and isolates the background", async () => {
    const user = userEvent.setup();
    renderShell();

    const openButton = screen.getByRole("button", { name: "Open navigation" });
    await user.click(openButton);

    const dialog = screen.getByRole("dialog", { name: "Navigation" });
    const closeButton = within(dialog).getByRole("button", { name: "Close navigation" });
    await waitFor(() => expect(closeButton).toHaveFocus());

    expect(document.querySelector(".workspace-body")?.hasAttribute("inert")).toBe(true);
    expect(document.querySelector(".mobile-header")?.hasAttribute("inert")).toBe(true);
    expect(document.querySelector(".mobile-bottom-nav")?.hasAttribute("inert")).toBe(true);
    expect(document.querySelector(".sidebar")?.hasAttribute("inert")).toBe(true);
    expect(document.documentElement.style.overflow).toBe("hidden");

    const links = within(dialog).getAllByRole("link");
    closeButton.focus();
    await user.tab({ shift: true });
    expect(links.at(-1)).toHaveFocus();
    await user.tab();
    expect(closeButton).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Navigation" })).not.toBeInTheDocument();
    expect(openButton).toHaveFocus();
    expect(document.querySelector(".workspace-body")?.hasAttribute("inert")).toBe(false);
    expect(document.documentElement.style.overflow).toBe("");
  });

  it("returns focus to the menu button when Close is pressed and restores scrolling", async () => {
    const user = userEvent.setup();
    renderShell();
    const openButton = screen.getByRole("button", { name: "Open navigation" });
    await user.click(openButton);
    document.documentElement.style.overflow = "hidden";
    await user.click(screen.getByRole("button", { name: "Close navigation" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(openButton).toHaveFocus();
    expect(document.documentElement.style.overflow).toBe("");
  });
});

describe("mobile tab labels", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ liveConfigured: false, model: "gpt-5.4-mini" }),
      }),
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("shows Events as the compact Conferences label", () => {
    render(
      <IntegrationStatusProvider>
        <MobileBottomNav />
      </IntegrationStatusProvider>,
    );
    const tabs = screen.getByRole("navigation", { name: "Primary navigation" });
    expect(within(tabs).getByRole("link", { name: "Conferences" })).toHaveTextContent("Events");
  });
});
