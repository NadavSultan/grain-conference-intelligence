"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ROUTES = [
  { href: "/", label: "Today's Focus" },
  { href: "/conferences", label: "Conferences" },
  { href: "/planning", label: "Planning" },
  { href: "/capture", label: "Capture" },
  { href: "/relationships", label: "Relationships" },
  { href: "/settings", label: "Settings" },
] as const;

export function AppNav() {
  const pathname = usePathname();

  return (
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
  );
}
