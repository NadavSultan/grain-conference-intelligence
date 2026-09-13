import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PlanControls } from "@/components/conferences/plan-controls";

describe("PlanControls", () => {
  afterEach(() => cleanup());

  it("keeps decision and owner edits local until Save changes", async () => {
    const onDecision = vi.fn();
    const onOwner = vi.fn();
    const user = userEvent.setup();
    render(
      <PlanControls
        plan={{ decision: "attend", owner: "Nadav" }}
        recommendation="attend"
        onDecision={onDecision}
        onOwner={onOwner}
      />,
    );

    await user.click(screen.getByRole("button", { name: "watch" }));
    await user.clear(screen.getByLabelText("Owner"));
    await user.type(screen.getByLabelText("Owner"), "Alex");
    expect(onDecision).not.toHaveBeenCalled();
    expect(onOwner).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Save changes" }));
    expect(onDecision).toHaveBeenCalledWith("watch");
    expect(onOwner).toHaveBeenCalledWith("Alex");
  });
});
