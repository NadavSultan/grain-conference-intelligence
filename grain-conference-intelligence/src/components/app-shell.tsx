import type { ReactNode } from "react";

import { AppSidebar } from "@/components/app-sidebar";
import { MobileBottomNav, MobileHeader } from "@/components/mobile-chrome";
import { WorkspaceTopbar } from "@/components/workspace-topbar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-frame">
      <AppSidebar />
      <div className="workspace">
        <MobileHeader />
        <WorkspaceTopbar />
        <div className="workspace-body">
          <main className="workspace-main">{children}</main>
        </div>
        <MobileBottomNav />
      </div>
    </div>
  );
}
