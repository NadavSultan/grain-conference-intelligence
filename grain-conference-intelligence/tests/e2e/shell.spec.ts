import { expect, test } from "@playwright/test";

test("390px primary navigation shows Events without horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Today" })).toBeVisible({ timeout: 15_000 });

  const tabs = page.getByRole("navigation", { name: "Primary navigation" });
  await expect(tabs.getByRole("link", { name: "Conferences" })).toHaveText("Events");
  await expect(tabs.getByRole("link", { name: "Today's Focus" })).toBeVisible();
  await expect(tabs.getByRole("link", { name: "Planning" })).toBeVisible();
  await expect(tabs.getByRole("link", { name: "Capture" })).toBeVisible();
  await expect(tabs.getByRole("link", { name: "Relationships" })).toBeVisible();

  const overflowX = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflowX).toBeLessThanOrEqual(1);
});

test("Grain wordmark returns to Today from every primary workspace route", async ({ page }) => {
  for (const route of ["/conferences", "/planning", "/capture", "/relationships", "/settings"]) {
    await page.goto(route);
    await page
      .getByRole("link", { name: "Grain Conference Intelligence — go to Today" })
      .click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { name: "Today" })).toBeVisible();
  }
});

test("conference workspace supports searchable split selection and alternate views", async ({ page }) => {
  await page.goto("/conferences");
  await expect(page.getByRole("heading", { name: "Conferences" })).toBeVisible();

  await page.getByPlaceholder("Search name, location, or vertical").fill("Money20/20 Europe");
  const selectedRow = page.getByRole("row", { name: /Money20\/20 Europe/ });
  await expect(selectedRow).toBeVisible();
  await selectedRow.click();
  await expect(page.getByRole("complementary", { name: "Selected conference" })).toContainText(
    "Money20/20 Europe",
  );

  await page.getByRole("button", { name: "Timeline" }).click();
  await expect(page.getByRole("heading", { name: "Conference timeline" })).toBeVisible();
  await page.getByRole("button", { name: "Regions" }).click();
  await expect(page.getByRole("heading", { name: "Conference regions" })).toBeVisible();
});

test("conference KPI cards filter the catalog and reset predictably", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/conferences");

  const catalogCount = page.locator(".catalog-count");
  const allEvents = page.getByRole("button", { name: /Verified events/ });
  const tierA = page.getByRole("button", { name: /Tier A priority events/ });
  const teamDeployed = page.getByRole("button", { name: /Team deployed/ });
  const coverageGaps = page.getByRole("button", { name: /Coverage gaps/ });

  await expect(allEvents).toHaveAttribute("aria-pressed", "true");
  await expect(catalogCount).toHaveText("12 of 12 verified events");

  await tierA.click();
  await expect(tierA).toHaveAttribute("aria-pressed", "true");
  await expect(catalogCount).toHaveText("7 of 12 verified events");
  await tierA.click();
  await expect(tierA).toHaveAttribute("aria-pressed", "false");
  await expect(catalogCount).toHaveText("12 of 12 verified events");

  await teamDeployed.click();
  await expect(teamDeployed).toHaveAttribute("aria-pressed", "true");
  await expect(catalogCount).toHaveText("5 of 12 verified events");
  await coverageGaps.click();
  await expect(coverageGaps).toHaveAttribute("aria-pressed", "true");
  await expect(teamDeployed).toHaveAttribute("aria-pressed", "false");
  await allEvents.click();
  await expect(allEvents).toHaveAttribute("aria-pressed", "true");
  await expect(catalogCount).toHaveText("12 of 12 verified events");
});

test("planning and relationship timeline badges stay compact", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });

  for (const route of ["/planning", "/relationships/marcus"]) {
    await page.goto(route);
    await expect(
      page.getByRole("heading", { name: route === "/planning" ? "Year list" : "Marcus Oyelaran" }),
    ).toBeVisible();
    const heights = await page.locator(".conference-card .ui-badge").evaluateAll((badges) =>
      badges.map((badge) => badge.getBoundingClientRect().height),
    );
    expect(heights.length).toBeGreaterThan(0);
    expect(Math.max(...heights)).toBeLessThanOrEqual(42);
  }
});

test("planning cards fit the 320px workspace without overflow", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/planning");
  await expect(page.getByRole("heading", { name: "Year list" })).toBeVisible();
  await expect(page.locator(".conference-card").first()).toBeVisible();

  const measurements = await page.evaluate(() => {
    const workspace = document.querySelector<HTMLElement>(".workspace-body");
    if (!workspace) return null;
    const workspaceBox = workspace.getBoundingClientRect();
    const cards = [...document.querySelectorAll<HTMLElement>(".conference-card")].filter(
      (card) => getComputedStyle(card).display !== "none",
    );
    const badges = cards.flatMap((card) =>
      [...card.querySelectorAll<HTMLElement>(".ui-badge")].map((badge) => {
        const box = badge.getBoundingClientRect();
        return { width: box.width, height: box.height, visible: box.width > 0 && box.height > 0 };
      }),
    );
    return {
      workspaceClientWidth: workspace.clientWidth,
      workspaceScrollWidth: workspace.scrollWidth,
      cards: cards.map((card) => {
        const box = card.getBoundingClientRect();
        return { left: box.left, right: box.right, workspaceLeft: workspaceBox.left, workspaceRight: workspaceBox.right };
      }),
      badges,
    };
  });

  expect(measurements).not.toBeNull();
  expect(measurements?.workspaceScrollWidth).toBeLessThanOrEqual(measurements?.workspaceClientWidth ?? 0);
  expect(measurements?.cards.length).toBeGreaterThan(0);
  expect(measurements?.cards.every((card) => card.left >= card.workspaceLeft && card.right <= card.workspaceRight)).toBe(true);
  expect(measurements?.badges.length).toBeGreaterThan(0);
  expect(measurements?.badges.every((badge) => badge.visible && badge.height <= 42 && badge.width >= 20)).toBe(true);
});

test("mobile drawer wordmark remains visible and selected conference metadata has spacing", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/conferences");
  await expect(page.getByRole("heading", { name: "Conferences" })).toBeVisible();
  await page.getByRole("button", { name: "Open navigation" }).click();
  const drawer = page.getByRole("dialog", { name: "Navigation" });
  const drawerWordmark = drawer.getByRole("link", { name: "Grain Conference Intelligence — go to Today" });
  await expect(drawerWordmark).toBeVisible();
  await expect(drawerWordmark.locator(".wordmark-name")).toHaveCSS("color", "rgb(20, 35, 79)");

  await page.getByRole("button", { name: "Close navigation" }).click();
  await page.goto("/conferences");
  await expect(page.getByRole("heading", { name: "Conferences" })).toBeVisible();
  const detailRows = page.locator(".conference-detail-panel .detail-row");
  const gaps = await detailRows.evaluateAll((rows) =>
    rows.map((row) => {
      const label = row.querySelector("span")?.getBoundingClientRect();
      const value = row.querySelector("strong")?.getBoundingClientRect();
      return label && value ? value.left - label.right : 0;
    }),
  );
  expect(gaps).toHaveLength(3);
  expect(Math.min(...gaps)).toBeGreaterThanOrEqual(8);
});

test("conference and Today KPI cards use balanced two-column layout at 1024px", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 900 });

  for (const route of ["/conferences", "/"]) {
    await page.goto(route);
    await expect(
      page.getByRole("heading", { name: route === "/conferences" ? "Conferences" : "Today" }),
    ).toBeVisible();
    const positions = await page.locator(".metric-grid > *").evaluateAll((cards) =>
      cards.map((card) => {
        const box = card.getBoundingClientRect();
        return { left: Math.round(box.left), top: Math.round(box.top) };
      }),
    );
    expect(positions).toHaveLength(4);
    expect(new Set(positions.map((position) => position.left)).size).toBe(2);
    expect(new Set(positions.map((position) => position.top)).size).toBe(2);
  }
});

test("representative catalog labels meet readable size and contrast", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/conferences");
  await expect(page.getByRole("heading", { name: "Conferences" })).toBeVisible();
  const metrics = await page.evaluate(() => {
    function parseColor(value: string) {
      const match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
      if (!match) return null;
      return { r: Number(match[1]), g: Number(match[2]), b: Number(match[3]), a: Number(match[4] ?? 1) };
    }
    function backgroundFor(element: Element) {
      let current: Element | null = element;
      while (current) {
        const color = parseColor(getComputedStyle(current).backgroundColor);
        if (color && color.a > 0) return color;
        current = current.parentElement;
      }
      return { r: 255, g: 255, b: 255, a: 1 };
    }
    function luminance(color: { r: number; g: number; b: number }) {
      return [color.r, color.g, color.b].map((channel) => channel / 255).map((channel) =>
        channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
      ).reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
    }
    function inspect(selector: string) {
      const element = document.querySelector(selector);
      if (!element) return null;
      const style = getComputedStyle(element);
      const foreground = parseColor(style.color);
      const background = backgroundFor(element);
      if (!foreground) return null;
      const light = Math.max(luminance(foreground), luminance(background));
      const dark = Math.min(luminance(foreground), luminance(background));
      return { fontSize: Number.parseFloat(style.fontSize), contrast: (light + 0.05) / (dark + 0.05) };
    }
    return {
      count: inspect(".catalog-count"),
      header: inspect(".data-table th"),
      filter: inspect(".compact-filter"),
    };
  });
  expect(metrics.count?.fontSize).toBeGreaterThanOrEqual(12);
  expect(metrics.header?.fontSize).toBeGreaterThanOrEqual(12);
  expect(metrics.filter?.fontSize).toBeGreaterThanOrEqual(12);
  expect(metrics.count?.contrast).toBeGreaterThanOrEqual(4.5);
  expect(metrics.header?.contrast).toBeGreaterThanOrEqual(4.5);
  expect(metrics.filter?.contrast).toBeGreaterThanOrEqual(4.5);
});
