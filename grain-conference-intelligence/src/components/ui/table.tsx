import type { HTMLAttributes, ReactNode, TdHTMLAttributes, ThHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

export function Table({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("table-wrap", className)}>
      <table className="data-table">{children}</table>
    </div>
  );
}

export function Th({ children, className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th className={cn(className)} {...props}>
      {children}
    </th>
  );
}

export function Td({ children, className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={cn(className)} {...props}>
      {children}
    </td>
  );
}

export function ResponsiveSection({
  desktop,
  mobile,
}: {
  desktop: ReactNode;
  mobile: ReactNode;
}) {
  return (
    <>
      <div className="desktop-only">{desktop}</div>
      <div className="mobile-only">{mobile}</div>
    </>
  );
}

export function StackList({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLUListElement> & { children: ReactNode }) {
  return (
    <ul className={cn("stack-list", className)} {...props}>
      {children}
    </ul>
  );
}
