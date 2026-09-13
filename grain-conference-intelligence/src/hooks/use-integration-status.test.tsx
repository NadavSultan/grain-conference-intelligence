import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  IntegrationStatusProvider,
  useIntegrationStatus,
} from "@/hooks/use-integration-status";

const FAKE_KEY = "test-openai-session-key-aaaa";
const MODE_STORAGE_KEY = "grain-openai-mode";

function StatusProbe({ label }: { label: string }) {
  const client = useIntegrationStatus();
  if (!client) return <p>{label}:loading</p>;
  return (
    <div>
      <p>{`${label}:${client.model}:${client.mode}:${client.source}`}</p>
      <p>{`configured:${client.configured}`}</p>
      <button type="button" onClick={() => void client.configure(FAKE_KEY)}>
        connect
      </button>
      <button type="button" onClick={() => void client.remove()}>
        remove
      </button>
      <button type="button" onClick={() => client.setMode("live")}>
        live
      </button>
    </div>
  );
}

function jsonResponse(body: unknown, ok = true) {
  return {
    ok,
    json: async () => body,
  };
}

describe("integration status", () => {
  afterEach(() => {
    cleanup();
    sessionStorage.clear();
    localStorage.clear();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("fetches /api/integrations/openai once for the shared shell", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ configured: false, source: "none", model: "gpt-5.4-mini" }),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <IntegrationStatusProvider>
        <StatusProbe label="sidebar" />
        <StatusProbe label="header" />
      </IntegrationStatusProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("sidebar:gpt-5.4-mini:demo:none")).toBeInTheDocument();
      expect(screen.getByText("header:gpt-5.4-mini:demo:none")).toBeInTheDocument();
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith("/api/integrations/openai");
  });

  it("defaults to Demo mode", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ configured: true, source: "deployment", model: "gpt-5.4-mini" })),
    );

    render(
      <IntegrationStatusProvider>
        <StatusProbe label="shell" />
      </IntegrationStatusProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("shell:gpt-5.4-mini:demo:deployment")).toBeInTheDocument();
    });
    expect(sessionStorage.getItem(MODE_STORAGE_KEY)).not.toBe("live");
  });

  it("configure, replace and remove never persist the API key", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ configured: false, source: "none", model: "gpt-5.4-mini" }))
      .mockResolvedValueOnce(jsonResponse({ configured: true, source: "session", model: "gpt-5.4-mini" }))
      .mockResolvedValueOnce(jsonResponse({ configured: true, source: "session", model: "gpt-5.4-mini" }))
      .mockResolvedValueOnce({ ok: true, json: async () => ({ configured: false, source: "none" }) })
      .mockResolvedValueOnce(jsonResponse({ configured: false, source: "none", model: "gpt-5.4-mini" }));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();

    render(
      <IntegrationStatusProvider>
        <StatusProbe label="shell" />
      </IntegrationStatusProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("shell:gpt-5.4-mini:demo:none")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "connect" }));
    await waitFor(() => {
      expect(screen.getByText("shell:gpt-5.4-mini:live:session")).toBeInTheDocument();
    });
    expect(fetchMock.mock.calls[1]?.[0]).toBe("/api/integrations/openai");
    expect(fetchMock.mock.calls[1]?.[1]).toMatchObject({ method: "POST" });
    expect(sessionStorage.getItem(MODE_STORAGE_KEY)).toBe("live");

    await user.click(screen.getByRole("button", { name: "connect" }));
    await waitFor(() => {
      expect(fetchMock.mock.calls[2]?.[1]).toMatchObject({ method: "POST" });
    });

    await user.click(screen.getByRole("button", { name: "remove" }));
    await waitFor(() => {
      expect(screen.getByText("shell:gpt-5.4-mini:demo:none")).toBeInTheDocument();
    });
    expect(sessionStorage.getItem(MODE_STORAGE_KEY)).toBe("demo");

    const storageDump = `${JSON.stringify(sessionStorage)} ${JSON.stringify(localStorage)}`;
    expect(storageDump).not.toContain(FAKE_KEY);
    expect(document.body.textContent).not.toContain(FAKE_KEY);
  });

  it("uses server liveConfigured and does not derive it from configured", async () => {
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

    function Probe() {
      const client = useIntegrationStatus();
      if (!client) return <p>loading</p>;
      return <p>{`live:${String(client.liveConfigured)} configured:${String(client.configured)}`}</p>;
    }

    render(
      <IntegrationStatusProvider>
        <Probe />
      </IntegrationStatusProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("live:false configured:true")).toBeInTheDocument();
    });
  });
});
