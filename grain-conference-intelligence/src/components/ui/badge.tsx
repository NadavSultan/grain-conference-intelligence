import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export type BadgeTone =
  | "neutral"
  | "blue"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "tier-a"
  | "tier-b"
  | "tier-c";

export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}) {
  return <span className={cn("ui-badge", `ui-badge-${tone}`, className)}>{children}</span>;
}

export function tierTone(tier: string): BadgeTone {
  if (tier === "A") return "tier-a";
  if (tier === "B") return "tier-b";
  return "tier-c";
}

export function decisionTone(decision: string): BadgeTone {
  if (decision === "attend") return "success";
  if (decision === "watch") return "blue";
  if (decision === "skip") return "neutral";
  return "warning";
}

export function humanizeToken(value: string): string {
  return value.replaceAll("_", " ").replace(/\b[a-z]/g, (char) => char.toUpperCase());
}
