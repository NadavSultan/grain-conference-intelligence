import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AppSidebar } from "@/components/app-sidebar";
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

function jsonResponse(body: unknown) {
  return { ok: true, json: async () => body };
}

describe("sidebar integration status", () => {
  afterEach(() => {
    cleanup();
    sessionStorage.clear();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("shows the selected Live mode without claiming Live AI when liveConfigured is false", async () => {
    sessionStorage.setItem("grain-openai-mode", "live");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          configured: true,
          liveConfigured: false,
          source: "deployment",
          model: "gpt-5.4-mini",
        }),
      ),
    );

    render(
      <IntegrationStatusProvider>
        <AppSidebar />
      </IntegrationStatusProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("Live mode")).toBeInTheDocument();
    });
    expect(screen.queryByText(/Live AI available/)).not.toBeInTheDocument();
    expect(screen.getByText(/Not configured in this environment/)).toBeInTheDocument();
  });

  it("claims Live AI available only when liveConfigured is true", async () => {
    sessionStorage.setItem("grain-openai-mode", "live");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          configured: true,
          liveConfigured: true,
          source: "session",
          model: "gpt-5.4-mini",
        }),
      ),
    );

    render(
      <IntegrationStatusProvider>
        <AppSidebar />
      </IntegrationStatusProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("Live mode")).toBeInTheDocument();
      expect(screen.getByText(/Live AI available · gpt-5.4-mini/)).toBeInTheDocument();
    });
  });
});
