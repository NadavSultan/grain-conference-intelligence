import type { ReactNode } from "react";

import { AppNav } from "@/components/app-nav";
import { GrainWordmark } from "@/components/grain-wordmark";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <header className="app-bar">
        <GrainWordmark />
        <AppNav />
      </header>
      <main className="app-main">{children}</main>
    </div>
  );
}
