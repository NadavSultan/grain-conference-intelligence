"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type IntegrationStatus = {
  liveConfigured: boolean;
  model: string;
};

const IntegrationStatusContext = createContext<IntegrationStatus | null>(null);

export function IntegrationStatusProvider({ children }: { children: ReactNode }) {
  const [live, setLive] = useState<IntegrationStatus | null>(null);

  useEffect(() => {
    void fetch("/api/relationship-brief")
      .then((response) => response.json())
      .then((payload) =>
        setLive({
          liveConfigured: Boolean(payload.liveConfigured),
          model: payload.model ?? "gpt-5.4-mini",
        }),
      )
      .catch(() => setLive({ liveConfigured: false, model: "gpt-5.4-mini" }));
  }, []);

  return (
    <IntegrationStatusContext.Provider value={live}>{children}</IntegrationStatusContext.Provider>
  );
}

export function useIntegrationStatus(): IntegrationStatus | null {
  return useContext(IntegrationStatusContext);
}
