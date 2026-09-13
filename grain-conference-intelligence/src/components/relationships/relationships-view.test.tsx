import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RelationshipsView } from "@/components/relationships/relationships-view";
import { WorkspaceProvider } from "@/workspace/provider";

vi.mock("next/link", () => ({
  default({ children, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) {
    return <a {...props}>{children}</a>;
  },
}));

describe("RelationshipsView conference organization", () => {
  afterEach(() => cleanup());

  it("shows the two EuroFinance prospects with their conference context", async () => {
    render(<WorkspaceProvider><RelationshipsView /></WorkspaceProvider>);

    expect(await screen.findByText("Emma Rossi")).toBeInTheDocument();
    expect(screen.getByText("Liam Becker")).toBeInTheDocument();
    expect(screen.getAllByText("EuroFinance International Treasury Management · 2026-09-16")).toHaveLength(2);
  });

  it("filters the relationship list by conference", async () => {
    const user = userEvent.setup();
    render(<WorkspaceProvider><RelationshipsView /></WorkspaceProvider>);

    await waitFor(() => expect(screen.getByRole("combobox", { name: "Conference" })).toBeInTheDocument());
    await user.selectOptions(screen.getByRole("combobox", { name: "Conference" }), "eurofinance-2026");

    expect(screen.getByText("Emma Rossi")).toBeInTheDocument();
    expect(screen.getByText("Liam Becker")).toBeInTheDocument();
    expect(screen.queryByText("Sam Jones")).not.toBeInTheDocument();
  });
});
