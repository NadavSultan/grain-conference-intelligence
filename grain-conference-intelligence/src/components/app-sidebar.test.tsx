import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AppSidebar } from "@/components/app-sidebar";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

vi.mock("next/link", () => ({
  default({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  },
}));

describe("sidebar navigation", () => {
  afterEach(() => {
    cleanup();
  });

  it("keeps the primary routes and settings shortcut available", () => {
    render(<AppSidebar />);

    const navigation = screen.getByRole("navigation", { name: "Primary navigation" });
    expect(within(navigation).getByRole("link", { name: "Today's Focus" })).toHaveAttribute("href", "/");
    expect(within(navigation).getByRole("link", { name: "Conferences" })).toHaveAttribute("href", "/conferences");
    expect(within(navigation).getByRole("link", { name: "Capture" })).toHaveAttribute("href", "/capture");
    expect(screen.getByRole("link", { name: "Open settings" })).toHaveAttribute("href", "/settings");
  });

  it("keeps the Grain wordmark as a link back to Today", () => {
    render(<AppSidebar />);

    expect(
      screen.getByRole("link", { name: "Grain Conference Intelligence — go to Today" }),
    ).toHaveAttribute("href", "/");
  });
});
