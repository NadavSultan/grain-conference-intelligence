"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { GrainWordmark } from "@/components/grain-wordmark";

const ROUTES = [
  { href: "/", label: "Today's Focus" },
  { href: "/conferences", label: "Conferences" },
  { href: "/planning", label: "Planning" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="app-shell">
      <header className="app-bar">
        <GrainWordmark />
        <nav aria-label="Primary navigation">
          {ROUTES.map((route) => {
            const active =
              route.href === "/"
                ? pathname === "/"
                : pathname === route.href || pathname.startsWith(`${route.href}/`);
            return (
              <Link
                key={route.href}
                href={route.href}
                className={active ? "nav-item nav-item-active" : "nav-item"}
                aria-current={active ? "page" : undefined}
              >
                {route.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="app-main">{children}</main>
    </div>
  );
}
