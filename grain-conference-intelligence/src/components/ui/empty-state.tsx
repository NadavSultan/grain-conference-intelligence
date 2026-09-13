import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export function EmptyState({
  title,
  description,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("empty-state", className)}>
      <p className="empty-state-title">{title}</p>
      {description ? <p className="empty-state-copy">{description}</p> : null}
    </div>
  );
}
