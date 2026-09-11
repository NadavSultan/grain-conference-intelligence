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
