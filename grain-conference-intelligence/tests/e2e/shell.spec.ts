import { expect, test } from "@playwright/test";

test("390px primary navigation shows Events without horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Decide coverage/ })).toBeVisible({ timeout: 15_000 });

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
