"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings } from "lucide-react";

import { PRIMARY_NAV, isNavActive } from "@/components/nav-config";
import { GrainWordmark } from "@/components/grain-wordmark";
import { NavItem } from "@/components/ui/nav-item";
import { useIntegrationStatus } from "@/hooks/use-integration-status";

export function AppSidebar() {
  const pathname = usePathname();
  const live = useIntegrationStatus();
  const liveReady = Boolean(live?.liveConfigured);

  return (
    <aside className="sidebar" aria-label="Application">
      <div className="sidebar-brand">
        <GrainWordmark stacked />
      </div>
      <nav className="sidebar-nav" aria-label="Primary navigation">
        {PRIMARY_NAV.map((route) => (
          <NavItem
            key={route.href}
            href={route.href}
            label={route.label}
            icon={route.icon}
            active={isNavActive(pathname, route.href)}
          />
        ))}
      </nav>
      <div className="sidebar-footer">
        <Link href="/settings" className="integration-card" aria-label="Demo and live integration status">
          <strong>
            <span className={liveReady ? "status-dot status-dot-live" : "status-dot status-dot-demo"} />
            {live?.mode === "live" ? "Live mode" : "Demo mode"}
          </strong>
          <p>
            HubSpot stays a persisted simulation. OpenAI:{" "}
            {live
              ? live.liveConfigured
                ? `Live AI available · ${live.model}`
                : "Not configured in this environment"
              : "Checking integration status…"}
            .
          </p>
        </Link>
        <Link href="/settings" className="sidebar-settings" aria-label="Open settings">
          <Settings size={16} aria-hidden="true" />
          Settings
        </Link>
      </div>
    </aside>
  );
}
