import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/cn";

export function NavItem({
  href,
  label,
  shortLabel,
  icon: Icon,
  active,
  compact = false,
  onNavigate,
}: {
  href: string;
  label: string;
  shortLabel?: string;
  icon: LucideIcon;
  active: boolean;
  compact?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      className={cn("nav-item", compact && "nav-item-compact", active && "nav-item-active")}
      aria-current={active ? "page" : undefined}
      aria-label={compact ? label : undefined}
      onClick={onNavigate}
    >
      <span className="nav-indicator" aria-hidden="true" />
      <Icon className="nav-icon" size={compact ? 20 : 18} strokeWidth={1.9} aria-hidden="true" />
      <span className={compact ? "nav-label-short" : "nav-label"}>{compact ? shortLabel ?? label : label}</span>
    </Link>
  );
}
