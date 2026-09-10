"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Settings, X } from "lucide-react";

import { MOBILE_TAB_NAV, PRIMARY_NAV, isNavActive } from "@/components/nav-config";
import { GrainWordmark } from "@/components/grain-wordmark";
import { NavItem } from "@/components/ui/nav-item";
import { useIntegrationStatus } from "@/hooks/use-integration-status";

export function MobileHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const drawerId = useId();
  const live = useIntegrationStatus();
  const liveReady = Boolean(live?.liveConfigured);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <header className="mobile-header">
        <GrainWordmark />
        <div className="button-row">
          <Link href="/settings" className="icon-btn" aria-label="Settings">
            <Settings size={18} aria-hidden="true" />
          </Link>
          <button
            type="button"
            className="icon-btn"
            aria-expanded={open}
            aria-controls={drawerId}
            onClick={() => setOpen(true)}
          >
            <Menu size={18} aria-hidden="true" />
            <span className="sr-only">Open navigation</span>
          </button>
        </div>
      </header>
      {open ? (
        <div className="mobile-drawer" role="presentation" onClick={() => setOpen(false)}>
          <div
            className="mobile-drawer-panel"
            id={drawerId}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="page-header-row">
              <GrainWordmark stacked />
              <button type="button" className="icon-btn" onClick={() => setOpen(false)}>
                <X size={18} aria-hidden="true" />
                <span className="sr-only">Close navigation</span>
              </button>
            </div>
            <nav aria-label="All destinations">
              {PRIMARY_NAV.map((route) => (
                <NavItem
                  key={route.href}
                  href={route.href}
                  label={route.label}
                  icon={route.icon}
                  active={isNavActive(pathname, route.href)}
                  onNavigate={() => setOpen(false)}
                />
              ))}
            </nav>
            <Link href="/settings" className="integration-card" onClick={() => setOpen(false)}>
              <strong>
                <span className={liveReady ? "status-dot status-dot-live" : "status-dot status-dot-demo"} />
                Demo mode
              </strong>
              <p>
                {live
                  ? liveReady
                    ? `Live AI available · ${live.model}`
                    : "OpenAI is not configured in this environment"
                  : "Checking integration status…"}
                . HubSpot remains a simulation.
              </p>
            </Link>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();
  return (
    <nav className="mobile-bottom-nav" aria-label="Primary navigation">
      {MOBILE_TAB_NAV.map((route) => (
        <NavItem
          key={route.href}
          href={route.href}
          label={route.label}
          shortLabel={route.shortLabel}
          icon={route.icon}
          active={isNavActive(pathname, route.href)}
          compact
        />
      ))}
    </nav>
  );
}
