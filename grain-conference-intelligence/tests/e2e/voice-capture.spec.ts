import { expect, test, type Page } from "@playwright/test";

const TRANSCRIPT =
  "Just met Marcus Oyelaran, he is VP Treasury at Northwind Payments. We talked about " +
  "their euro dollar exposure on the Brazil corridor. His email is marcus at northwind dot com. " +
  "He wants a demo, I said I would send times next week.";

const EXTRACTION = {
  name: "Marcus Oyelaran",
  company: "Northwind Payments",
  role: "VP Treasury",
  note: "EUR/USD exposure on the Brazil corridor",
  email: "marcus@northwind.com",
  linkedIn: "",
  nextStep: "Send demo times next week",
};

/** Replaces the microphone with a recorder that always yields a small blob. */
async function stubMicrophone(page: Page) {
  await page.addInitScript(() => {
    class FakeRecorder {
      state = "inactive";
      mimeType = "audio/webm";
      ondataavailable: ((event: { data: Blob }) => void) | null = null;
      onstop: (() => void) | null = null;
      start() {
        this.state = "recording";
      }
      stop() {
        this.state = "inactive";
        this.ondataavailable?.({ data: new Blob([new Uint8Array(2048)], { type: "audio/webm" }) });
        this.onstop?.();
      }
    }
    Object.defineProperty(window, "MediaRecorder", { value: FakeRecorder, configurable: true });
    Object.defineProperty(navigator, "mediaDevices", {
      value: { getUserMedia: async () => ({ getTracks: () => [] }) },
      configurable: true,
    });
  });
}

async function stubVoiceRoutes(page: Page, extraction: Record<string, string> = EXTRACTION) {
  await page.route("**/api/capture/transcribe", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, transcript: TRANSCRIPT, model: "gpt-transcribe", usageRemaining: 20 }),
    }),
  );
  await page.route("**/api/capture/extract", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        extraction,
        filled: Object.keys(extraction).filter((key) => extraction[key].length > 0),
        model: "gpt-5.6-luna",
        usageRemaining: 19,
      }),
    }),
  );
}

async function openCaptureForm(page: Page) {
  await page.goto("/capture");
  await expect(page.getByRole("heading", { name: "Scheduled meetings" })).toBeVisible({ timeout: 15_000 });
  await page.getByRole("button", { name: "Update an unplanned meeting" }).click();
  await expect(page.getByRole("heading", { name: "Unplanned meeting" })).toBeVisible();
}

async function recordOnce(page: Page) {
  await page.getByRole("button", { name: "Record" }).click();
  await page.getByRole("button", { name: "Stop and fill fields" }).click();
}

test("a spoken note fills every field the rep stated", async ({ page }) => {
  await stubMicrophone(page);
  await stubVoiceRoutes(page);
  await openCaptureForm(page);
  await recordOnce(page);

  await expect(page.getByLabel(/^Name/)).toHaveValue("Marcus Oyelaran");
  await expect(page.getByLabel(/^Company/)).toHaveValue("Northwind Payments");
  await expect(page.getByLabel(/Role/)).toHaveValue("VP Treasury");
  await expect(page.getByLabel(/Short note/)).toHaveValue("EUR/USD exposure on the Brazil corridor");
  await expect(page.getByLabel(/Next step/)).toHaveValue("Send demo times next week");
  await expect(page.getByText("What was heard")).toBeVisible();
});

test("a spoken email must be confirmed, and the encounter persists across reload", async ({ page }) => {
  await stubMicrophone(page);
  await stubVoiceRoutes(page);
  await openCaptureForm(page);
  await recordOnce(page);

  await expect(page.getByText(/a spoken address is not verified/i)).toBeVisible();
  await page.getByRole("button", { name: /confirm this is the email/i }).click();
  await expect(page.getByText(/a spoken address is not verified/i)).toHaveCount(0);

  await page.getByRole("button", { name: "Save encounter" }).click();
  await page.goto("/relationships");
  await expect(page.getByText("Marcus Oyelaran").first()).toBeVisible();

  await page.reload();
  await expect(page.getByText("Marcus Oyelaran").first()).toBeVisible();
});

test("discarding a spoken email clears it and still saves the encounter", async ({ page }) => {
  await stubMicrophone(page);
  await stubVoiceRoutes(page);
  await openCaptureForm(page);
  await recordOnce(page);

  await page.getByRole("button", { name: /discard it/i }).click();
  await expect(page.getByLabel(/Verified email/)).toHaveValue("");
  await page.getByRole("button", { name: "Save encounter" }).click();

  await page.goto("/relationships");
  await expect(page.getByText("Marcus Oyelaran").first()).toBeVisible();
});

test("a failed transcription keeps the rep able to type, at 390px", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await stubMicrophone(page);
  await page.route("**/api/capture/transcribe", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: false, code: "not_configured", retryable: false }),
    }),
  );
  await openCaptureForm(page);
  await recordOnce(page);

  await expect(page.getByText(/connect an openai key in settings/i)).toBeVisible();
  await page.getByLabel(/^Name/).fill("Typed Person");
  await page.getByLabel(/^Company/).fill("Typed Co");
  await page.getByLabel(/Short note/).fill("Typed by hand after voice failed");
  await page.getByRole("button", { name: "Save encounter" }).click();

  const overflowX = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflowX).toBeLessThanOrEqual(1);

  await page.goto("/relationships");
  await expect(page.getByText("Typed Person").first()).toBeVisible();
});
