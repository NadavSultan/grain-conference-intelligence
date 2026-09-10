import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/cn";

export function Card({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLElement> & { children: ReactNode }) {
  return (
    <section className={cn("ui-card", className)} {...props}>
      {children}
    </section>
  );
}

export function CardHeader({
  title,
  description,
  actions,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="ui-card-header">
      <div>
        <h2 className="ui-card-title">{title}</h2>
        {description ? <p className="ui-card-copy">{description}</p> : null}
      </div>
      {actions ? <div className="ui-card-actions">{actions}</div> : null}
    </div>
  );
}
