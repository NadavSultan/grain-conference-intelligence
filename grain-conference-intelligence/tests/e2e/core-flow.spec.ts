import { expect, test, type Page } from "@playwright/test";

const VIEWPORTS = [
  { name: "desktop", width: 1280, height: 800 },
  { name: "mobile-390", width: 390, height: 844 },
] as const;

async function assertNoHorizontalOverflow(page: Page) {
  const overflowX = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflowX).toBeLessThanOrEqual(1);
}

async function runCoreJourney(page: Page, viewport: (typeof VIEWPORTS)[number]) {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => {
    consoleErrors.push(error.message);
  });

  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  await page.addInitScript(() => {
    window.sessionStorage.setItem("grain-openai-mode", "live");
  });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Today" })).toBeVisible({ timeout: 15_000 });

  await page.getByRole("link", { name: "Conferences" }).click();
  await page.getByPlaceholder("Search name, location, or vertical").fill("Money20/20 Europe");
  await expect(page.getByRole("complementary", { name: "Selected conference" })).toContainText("Money20/20 Europe");
  await page.getByRole("link", { name: "Open conference workspace" }).click();
  await expect(page).toHaveURL(/\/conferences\/money20-europe-2027$/);
  await expect(page.getByRole("heading", { name: "Money20/20 Europe" })).toBeVisible();
  await expect(page.getByText("Explainable score snapshot")).toBeVisible();
  await expect(page.getByText("Research time")).toBeVisible();

  await page.getByRole("tab", { name: "Prep" }).click();
  await expect(page).toHaveURL(/tab=prep/);
  await expect(page.getByRole("heading", { name: "Verified attendees" })).toBeVisible();
  await page.getByRole("link", { name: "David Cohen" }).click();
  await expect(page.getByRole("heading", { name: "David Cohen", exact: true }).first()).toBeVisible();
  await expect(page.getByText("Next best action")).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("link", { name: "Capture" }).click();
  await expect(page.getByRole("heading", { name: "Scheduled meetings" })).toBeVisible();
  await page.getByRole("button", { name: "Update", exact: true }).click();
  await expect(page).toHaveURL(/\/capture\/pm-marcus$/);
  await expect(page.getByRole("heading", { name: "Update meeting" })).toBeVisible();
  await page.getByLabel("Short note").fill("Agreed a corridor walkthrough next Tuesday.");
  await page.getByLabel("Next step (optional)").fill("Corridor walkthrough next Tuesday");
  await page.getByRole("button", { name: "Save encounter" }).click();

  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  await page.getByRole("link", { name: "Relationships" }).click();
  await page.getByRole("link", { name: "Marcus Oyelaran" }).click();
  await expect(page.getByText(/2 actual meetings/)).toBeVisible();
  await expect(page.locator("#enc-pm-marcus")).toHaveCount(1);

  await page.getByRole("button", { name: "Generate relationship brief" }).click();
  await expect(page.locator("p.eyebrow").filter({ hasText: /Deterministic fallback|Live AI/ })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole("link", { name: "enc-marcus-money20-prior" })).toBeVisible();

  await page.getByRole("button", { name: "Open CRM preview" }).click();
  await page.getByRole("button", { name: "Run demo sync" }).click();
  await page.getByRole("button", { name: "Run demo sync" }).click();
  await expect(page.getByText(/Contact step/)).toContainText(/created|reused/);
  await expect(page.getByText(/Note step/)).toContainText(/created|reused/);
  await expect(page.getByText(/View in HubSpot \(demo record\) demo-hs-contact-marcus/)).toBeVisible();

  await page.reload();
  await expect(page.getByText(/2 actual meetings/)).toBeVisible();
  await expect(page.locator("p.eyebrow").filter({ hasText: /Deterministic fallback|Live AI|Cached demo example/ })).toBeVisible();
  await expect(page.getByText(/View in HubSpot \(demo record\) demo-hs-contact-marcus/)).toBeVisible();

  await page.getByRole("link", { name: "Planning" }).click();
  await expect(page.getByRole("heading", { name: "Coverage plan" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Conference coverage timeline" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Conflicts" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Trip clusters" })).toBeVisible();
  await expect(page.getByText(/Uncovered quarters:/)).toBeVisible();

  await assertNoHorizontalOverflow(page);
  expect(consoleErrors, consoleErrors.join("\n")).toEqual([]);
}

for (const viewport of VIEWPORTS) {
  test(`core P0 journey on ${viewport.name}`, async ({ page }) => {
    await runCoreJourney(page, viewport);
  });
}
