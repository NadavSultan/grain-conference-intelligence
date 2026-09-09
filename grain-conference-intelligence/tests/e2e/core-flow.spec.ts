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
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => {
    consoleErrors.push(error.message);
  });

  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Decide coverage/ })).toBeVisible({ timeout: 15_000 });

  await page.getByRole("link", { name: "Conferences" }).click();
  await page.getByPlaceholder("Name or city").fill("Money20/20 Europe");
  await page.getByRole("link", { name: "Money20/20 Europe" }).click();
  await expect(page.getByRole("heading", { name: "Money20/20 Europe" })).toBeVisible();
  await expect(page.getByText("Explainable score snapshot")).toBeVisible();
  await expect(page.getByText("Research time")).toBeVisible();

  await page.getByRole("tab", { name: "Prep" }).click();
  await expect(page).toHaveURL(/tab=prep/);
  await expect(page.getByRole("button", { name: /Attendees verified/ })).toBeVisible();
  await page.getByRole("button", { name: /Attendees verified/ }).click();
  await page.getByRole("button", { name: /Need coordination/ }).click();
  await page.getByRole("link", { name: "David Cohen" }).click();
  await expect(page.getByText(/Prospect draft actions are blocked until coordination/i)).toBeVisible();
  await expect(page.locator("textarea").first()).toBeDisabled();
  await page.getByRole("button", { name: "Acknowledge coordination" }).click();
  await expect(page.locator("textarea").first()).toBeEnabled();
  await page.getByLabel("Subject").fill("Your treasury panel on Thursday — following up");
  await page.getByRole("button", { name: "Copy", exact: true }).click();

  await page.getByRole("link", { name: /Back to .* Prep/ }).click();
  await page.getByRole("link", { name: "Marcus Oyelaran" }).click();
  await page.getByRole("button", { name: "Add to field list" }).click();
  await expect(page.getByRole("button", { name: "On field list" })).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("link", { name: "Capture" }).click();
  await expect(page.getByRole("heading", { name: "You planned to meet" })).toBeVisible();
  await page.getByRole("button", { name: "Met" }).click();
  await page.getByLabel("Short note").fill("Agreed a corridor walkthrough next Tuesday.");
  await page.getByLabel("Next step (optional)").fill("Corridor walkthrough next Tuesday");
  await page.getByRole("button", { name: "Save encounter" }).click();
  await page.getByRole("button", { name: "Save encounter" }).click();

  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  await page.getByRole("link", { name: "Relationships" }).click();
  await page.getByRole("link", { name: "Marcus Oyelaran" }).click();
  await expect(page.getByText(/2 actual meetings/)).toBeVisible();
  await expect(page.locator("#enc-pm-marcus")).toHaveCount(1);

  await page.getByRole("button", { name: "Generate relationship brief" }).click();
  await expect(page.getByText(/Deterministic fallback|Live AI/)).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole("link", { name: "enc-marcus-money20-prior" })).toBeVisible();

  await page.getByRole("button", { name: "Open CRM preview" }).click();
  await page.getByRole("button", { name: "Run demo sync" }).click();
  await page.getByRole("button", { name: "Run demo sync" }).click();
  await expect(page.getByText(/Contact step/)).toContainText(/created|reused/);
  await expect(page.getByText(/Note step/)).toContainText(/created|reused/);
  await expect(page.getByText(/View in HubSpot \(demo record\) demo-hs-contact-marcus/)).toBeVisible();

  await page.reload();
  await expect(page.getByText(/2 actual meetings/)).toBeVisible();
  await expect(page.getByText(/Deterministic fallback|Live AI|Cached demo example/)).toBeVisible();
  await expect(page.getByText(/View in HubSpot \(demo record\) demo-hs-contact-marcus/)).toBeVisible();

  await page.getByRole("link", { name: "Planning" }).click();
  await expect(page.getByRole("heading", { name: "Year list" })).toBeVisible();
  await expect(page.getByText(/attend · Alex · Q 1/)).toBeVisible();
  await expect(page.getByText(/researched 2026/).first()).toBeVisible();
  await expect(page.getByText(/Conflict for Alex/).first()).toBeVisible();
  await expect(page.getByText(/Trip cluster:/).first()).toBeVisible();
  await expect(page.getByText(/Uncovered quarters:/)).toBeVisible();

  await assertNoHorizontalOverflow(page);
  expect(consoleErrors, consoleErrors.join("\n")).toEqual([]);
}

for (const viewport of VIEWPORTS) {
  test(`core P0 journey on ${viewport.name}`, async ({ page }) => {
    await runCoreJourney(page, viewport);
  });
}
