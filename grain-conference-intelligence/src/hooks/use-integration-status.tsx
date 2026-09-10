"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type CredentialSource = "session" | "deployment" | "none";
export type IntegrationMode = "demo" | "live";

export type IntegrationStatus = {
  configured: boolean;
  source: CredentialSource;
  model: string;
  liveConfigured: boolean;
};

export type IntegrationClient = IntegrationStatus & {
  status: IntegrationStatus;
  mode: IntegrationMode;
  configure: (apiKey: string) => Promise<boolean>;
  remove: () => Promise<void>;
  setMode: (mode: IntegrationMode) => void;
};

const MODE_STORAGE_KEY = "grain-openai-mode";

type ContextValue = {
  status: IntegrationStatus | null;
  mode: IntegrationMode;
  configure: (apiKey: string) => Promise<boolean>;
  remove: () => Promise<void>;
  setMode: (mode: IntegrationMode) => void;
};

const IntegrationStatusContext = createContext<ContextValue | null>(null);

function readStoredMode(): IntegrationMode {
  try {
    return sessionStorage.getItem(MODE_STORAGE_KEY) === "live" ? "live" : "demo";
  } catch {
    return "demo";
  }
}

function writeStoredMode(mode: IntegrationMode) {
  try {
    sessionStorage.setItem(MODE_STORAGE_KEY, mode);
  } catch {
    // Private mode or quota failures should not persist the API key anywhere else.
  }
}

type StatusPayload = {
  configured?: boolean;
  liveConfigured?: boolean;
  source?: string;
  model?: string;
};

function toStatus(payload: StatusPayload): IntegrationStatus {
  const source: CredentialSource =
    payload.source === "session" || payload.source === "deployment" ? payload.source : "none";
  return {
    configured: Boolean(payload.configured),
    source,
    model: payload.model ?? "gpt-5.4-mini",
    liveConfigured: Boolean(payload.liveConfigured),
  };
}

export function IntegrationStatusProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<IntegrationStatus | null>(null);
  const [mode, setModeState] = useState<IntegrationMode>("demo");

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/integrations/openai");
      const payload = (await response.json()) as StatusPayload;
      setStatus(toStatus(payload));
      return toStatus(payload);
    } catch {
      const fallback = toStatus({ configured: false, source: "none" });
      setStatus(fallback);
      return fallback;
    }
  }, []);

  useEffect(() => {
    void fetch("/api/integrations/openai")
      .then((response) => response.json())
      .then((payload: StatusPayload) => {
        setStatus(toStatus(payload));
        setModeState(readStoredMode());
      })
      .catch(() => setStatus(toStatus({ configured: false, source: "none" })));
  }, []);

  const setMode = useCallback((next: IntegrationMode) => {
    setModeState(next);
    writeStoredMode(next);
  }, []);

  const configure = useCallback(
    async (apiKey: string) => {
      const response = await fetch("/api/integrations/openai", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ apiKey }),
      });
      if (!response.ok) return false;
      const payload = (await response.json()) as StatusPayload;
      setStatus(toStatus(payload));
      setMode("live");
      return true;
    },
    [setMode],
  );

  const remove = useCallback(async () => {
    await fetch("/api/integrations/openai", { method: "DELETE" });
    await refresh();
    setMode("demo");
  }, [refresh, setMode]);

  const value = useMemo<ContextValue>(
    () => ({ status, mode, configure, remove, setMode }),
    [status, mode, configure, remove, setMode],
  );

  return (
    <IntegrationStatusContext.Provider value={value}>{children}</IntegrationStatusContext.Provider>
  );
}

export function useIntegrationStatus(): IntegrationClient | null {
  const context = useContext(IntegrationStatusContext);
  if (!context?.status) return null;
  return {
    ...context.status,
    status: context.status,
    mode: context.mode,
    configure: context.configure,
    remove: context.remove,
    setMode: context.setMode,
  };
}
