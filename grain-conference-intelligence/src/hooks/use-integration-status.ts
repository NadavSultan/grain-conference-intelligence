"use client";

import { useEffect, useState } from "react";

export type IntegrationStatus = {
  liveConfigured: boolean;
  model: string;
};

export function useIntegrationStatus(): IntegrationStatus | null {
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

  return live;
}
