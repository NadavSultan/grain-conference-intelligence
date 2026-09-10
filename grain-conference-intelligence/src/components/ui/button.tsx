import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "warning";
export type ButtonSize = "sm" | "md";

export function buttonClassName(
  variant: ButtonVariant = "secondary",
  size: ButtonSize = "md",
  className?: string,
) {
  return cn("ui-btn", `ui-btn-${variant}`, `ui-btn-${size}`, className);
}

export function Button({
  variant = "secondary",
  size = "md",
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return <button type={type} className={buttonClassName(variant, size, className)} {...props} />;
}

export function ButtonRow({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("button-row", className)}>{children}</div>;
}
