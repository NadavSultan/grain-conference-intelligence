import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  IntegrationStatusProvider,
  useIntegrationStatus,
} from "@/hooks/use-integration-status";

function StatusProbe({ label }: { label: string }) {
  const status = useIntegrationStatus();
  return <p>{status ? `${label}:${status.model}` : `${label}:loading`}</p>;
}

describe("integration status", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("fetches /api/relationship-brief once for the shared shell", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ liveConfigured: false, model: "gpt-5.4-mini" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <IntegrationStatusProvider>
        <StatusProbe label="sidebar" />
        <StatusProbe label="header" />
      </IntegrationStatusProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("sidebar:gpt-5.4-mini")).toBeInTheDocument();
      expect(screen.getByText("header:gpt-5.4-mini")).toBeInTheDocument();
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith("/api/relationship-brief");
  });
});
