import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export type Breadcrumb = { href?: string; label: string };

export function PageHeader({
  eyebrow,
  title,
  description,
  breadcrumbs,
  actions,
  tabs,
  titleId,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  breadcrumbs?: Breadcrumb[];
  actions?: ReactNode;
  tabs?: ReactNode;
  titleId?: string;
}) {
  return (
    <header className={cn("page-header", tabs && "page-header-with-tabs")}>
      {breadcrumbs && breadcrumbs.length > 0 ? (
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <ol>
            {breadcrumbs.map((crumb, index) => (
              <li key={`${crumb.label}-${index}`}>
                {crumb.href ? <Link href={crumb.href}>{crumb.label}</Link> : <span>{crumb.label}</span>}
              </li>
            ))}
          </ol>
        </nav>
      ) : null}
      <div className="page-header-row">
        <div className="page-header-copy">
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          <h1 id={titleId}>{title}</h1>
          {description ? <p className="lede">{description}</p> : null}
        </div>
        {actions ? <div className="page-header-actions">{actions}</div> : null}
      </div>
      {tabs}
    </header>
  );
}
