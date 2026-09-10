"use client";

import { PRIMARY_NAV, isNavActive } from "@/components/nav-config";
import { NavItem } from "@/components/ui/nav-item";
import { usePathname } from "next/navigation";

export function AppNav() {
  const pathname = usePathname();

  return (
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
  );
}
