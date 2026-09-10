import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export type AlertTone = "info" | "warning" | "danger";

export function Alert({
  tone = "info",
  children,
  className,
}: {
  tone?: AlertTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("ui-alert", `ui-alert-${tone}`, className)} role="status">
      {children}
    </div>
  );
}
