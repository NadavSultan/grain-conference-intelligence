import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export function MetricCard({
  label,
  value,
  hint,
  href,
  highlighted = false,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  href?: string;
  highlighted?: boolean;
}) {
  const className = cn("metric-card", highlighted && "metric-card-highlight");
  const inner = (
    <>
      <p className="metric-label">{label}</p>
      <p className="metric-value">{value}</p>
      {hint ? <p className="metric-hint">{hint}</p> : null}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {inner}
      </Link>
    );
  }

  return <article className={className}>{inner}</article>;
}
