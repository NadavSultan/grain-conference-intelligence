import type { ReactNode } from "react";

import { GrainWordmark } from "@/components/grain-wordmark";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <header className="app-bar">
        <GrainWordmark />
        <nav aria-label="Primary navigation">
          <span className="nav-item nav-item-active" aria-current="page">
            Workspace
          </span>
        </nav>
      </header>
      <main className="app-main">{children}</main>
    </div>
  );
}
