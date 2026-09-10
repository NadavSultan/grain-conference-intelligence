import {
  CalendarDays,
  CalendarRange,
  ClipboardPen,
  LayoutDashboard,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavItemConfig = {
  href: string;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
};

export const PRIMARY_NAV: NavItemConfig[] = [
  { href: "/", label: "Today's Focus", shortLabel: "Focus", icon: LayoutDashboard },
  { href: "/conferences", label: "Conferences", shortLabel: "Conferences", icon: CalendarDays },
  { href: "/planning", label: "Planning", shortLabel: "Planning", icon: CalendarRange },
  { href: "/capture", label: "Capture", shortLabel: "Capture", icon: ClipboardPen },
  { href: "/relationships", label: "Relationships", shortLabel: "People", icon: Users },
  { href: "/settings", label: "Settings", shortLabel: "Settings", icon: Settings },
];

export const MOBILE_TAB_NAV = PRIMARY_NAV.filter((item) => item.href !== "/settings");

export function isNavActive(pathname: string, href: string): boolean {
  return href === "/"
    ? pathname === "/"
    : pathname === href || pathname.startsWith(`${href}/`);
}
