"use client";

import { usePathname } from "next/navigation";

import { PRIMARY_NAV } from "@/components/nav-config";

function currentSection(pathname: string): string {
  const route = PRIMARY_NAV.find((item) =>
    item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
  return route?.label === "Today's Focus" ? "Today" : route?.label ?? "Workspace";
}

export function WorkspaceTopbar() {
  const pathname = usePathname();

  return (
    <header className="workspace-topbar">
      <div className="topbar-breadcrumb" aria-label="Current location">
        <span>Conference Intelligence</span>
        <span className="topbar-separator" aria-hidden="true">
          /
        </span>
        <strong>{currentSection(pathname)}</strong>
      </div>
      <div className="topbar-meta">
        <span className="topbar-status">
          <span className="status-dot status-dot-demo" aria-hidden="true" />
          Demo workspace
        </span>
        <span className="topbar-avatar" aria-label="Nadav, Grain sales">
          NS
        </span>
      </div>
    </header>
  );
}
