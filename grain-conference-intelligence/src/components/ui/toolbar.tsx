import type { FormHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/cn";

export function Toolbar({
  children,
  className,
  ...props
}: FormHTMLAttributes<HTMLFormElement> & { children: ReactNode }) {
  return (
    <form className={cn("toolbar", className)} onSubmit={(event) => event.preventDefault()} {...props}>
      {children}
    </form>
  );
}
