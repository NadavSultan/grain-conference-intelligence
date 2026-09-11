"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Settings, X } from "lucide-react";

import { MOBILE_TAB_NAV, PRIMARY_NAV, isNavActive } from "@/components/nav-config";
import { GrainWordmark } from "@/components/grain-wordmark";
import { NavItem } from "@/components/ui/nav-item";
import { useIntegrationStatus } from "@/hooks/use-integration-status";

const BACKGROUND_SELECTORS = [".sidebar", ".mobile-header", ".workspace-body", ".mobile-bottom-nav"];
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

function getFocusable(container: HTMLElement): HTMLElement[] {
  return [...container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)].filter(
    (element) => !element.hasAttribute("inert") && element.tabIndex !== -1,
  );
}

export function MobileHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const drawerId = useId();
  const live = useIntegrationStatus();
  const liveReady = Boolean(live?.liveConfigured);
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const background = BACKGROUND_SELECTORS.map((selector) => document.querySelector(selector)).filter(
      (element): element is Element => element instanceof Element,
    );
    const html = document.documentElement;
    const body = document.body;
    const workspace = document.querySelector(".workspace-body");
    const previousHtmlOverflow = html.style.overflow;
    const previousBodyOverflow = body.style.overflow;
    const previousWorkspaceOverflow = workspace instanceof HTMLElement ? workspace.style.overflow : "";

    background.forEach((element) => element.setAttribute("inert", ""));
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    if (workspace instanceof HTMLElement) workspace.style.overflow = "hidden";

    const trigger = openButtonRef.current;
    closeButtonRef.current?.focus();

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      const nodes = getFocusable(panelRef.current);
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      background.forEach((element) => element.removeAttribute("inert"));
      html.style.overflow = previousHtmlOverflow;
      body.style.overflow = previousBodyOverflow;
      if (workspace instanceof HTMLElement) workspace.style.overflow = previousWorkspaceOverflow;
      trigger?.focus();
    };
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
            ref={openButtonRef}
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
            ref={panelRef}
            className="mobile-drawer-panel"
            id={drawerId}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="page-header-row">
              <button
                ref={closeButtonRef}
                type="button"
                className="icon-btn mobile-drawer-close"
                onClick={() => setOpen(false)}
              >
                <X size={18} aria-hidden="true" />
                <span className="sr-only">Close navigation</span>
              </button>
              <GrainWordmark stacked />
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
                {live?.mode === "live" ? "Live mode" : "Demo mode"}
              </strong>
              <p>
                {live
                  ? live.liveConfigured
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
