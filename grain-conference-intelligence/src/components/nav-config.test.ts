import { describe, expect, it } from "vitest";

import { PRIMARY_NAV } from "@/components/nav-config";

describe("navigation labels", () => {
  it("keeps the desktop Conferences label and uses Events on compact mobile tabs", () => {
    const conferences = PRIMARY_NAV.find((item) => item.href === "/conferences");
    expect(conferences?.label).toBe("Conferences");
    expect(conferences?.shortLabel).toBe("Events");
  });
});
