import { test } from "@e2e-dev/web";
import { credentials, expect } from "e2e";

const SAMPLE_REFERRAL_PDF_PATH =
  process.env.E2E_SAMPLE_PDF ??
  "/Users/amrhazem/Desktop/Medical Documents/Patricia Henderson.pdf";
const SAMPLE_REFERRAL_FILE_NAME = "Patricia Henderson.pdf";
const EXTRACTION_TIMEOUT_MS = 5 * 60_000;
const CORRECTED_VALUE = "E2E corrected value";

test(
  "a reviewer corrects an extracted field inline and the correction persists",
  {
    timeout: EXTRACTION_TIMEOUT_MS + 120_000,
    tags: ["review", "state-changing"],
  },
  async ({ app, screen, browser }) => {
    // Test-safety guard: writes to S3 + Postgres + Redis, so local targets only.
    const baseUrl = app.baseUrl ?? "";
    if (!/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/.test(baseUrl)) {
      throw new Error(
        `Refusing to run a state-changing test against non-local target: ${baseUrl}`,
      );
    }
    const clinicAccount = credentials.user("clinic");

    // 1. Sign in and produce a COMPLETED referral through the real upload journey.
    await app.open("/auth");
    await screen.getByLabel("Username").fill(clinicAccount.username);
    await screen.getByLabel("Password").fill(clinicAccount.password);
    await screen.getByRole("button", "Sign in").tap();
    await expect(browser).toHaveURL(/\/dashboard/);

    await browser
      .locator("input[type=file]")
      .setInputFiles([SAMPLE_REFERRAL_PDF_PATH]);
    const extractButton = screen.getByRole("button", "Upload & extract 1 file");
    await expect(extractButton).toBeEnabled();
    await extractButton.tap();

    const referralRow = screen
      .getByRole("button")
      .filter({ hasText: SAMPLE_REFERRAL_FILE_NAME })
      .first();
    await expect(referralRow).toBeVisible({ timeout: 90_000 });
    await expect(referralRow).toHaveAttribute("data-status", "COMPLETED", {
      timeout: EXTRACTION_TIMEOUT_MS,
    });

    // 2. Open the review page.
    await referralRow.tap();
    await expect(browser).toHaveURL(/\/referrals\/[^/]+/);
    const reviewUrl = await browser.url();

    // 3. Edit the first extracted field's value inline (Enter commits).
    const editableField = browser
      .locator('[data-component="EditableExtractedField"]')
      .first();
    await expect(editableField).toBeVisible({ timeout: 30_000 });
    await expect(editableField).toHaveAttribute("data-state", "view");
    const originalText = ((await editableField.textContent()) ?? "").trim();

    await browser
      .locator(
        '[data-component="EditableExtractedField"] button[aria-label^="Edit "]',
      )
      .first()
      .tap();
    await expect(editableField).toHaveAttribute("data-state", "editing");
    const valueInput = browser
      .locator(
        '[data-component="EditableExtractedField"] input[aria-label="Field value"]',
      )
      .first();
    await valueInput.fill(CORRECTED_VALUE);
    await valueInput.press("Enter");

    // 4. Optimistic: "Edited" badge + "AI: <original>" appear right away.
    await expect(editableField).toContainText(CORRECTED_VALUE, {
      timeout: 2_000,
    });
    await expect(editableField).toContainText("Edited", { timeout: 2_000 });
    await expect(editableField).toContainText("AI:", { timeout: 2_000 });
    // Settles out of pending/saving without an error.
    await expect(editableField).not.toHaveAttribute("data-state", "error");
    await expect(editableField).toHaveAttribute("data-state", "view", {
      timeout: 15_000,
    });
    expect(originalText.length).toBeGreaterThan(0);

    // 5. Reload: the correction persisted.
    await app.open(new URL(reviewUrl).pathname);
    const reloadedField = browser
      .locator('[data-component="EditableExtractedField"]')
      .first();
    await expect(reloadedField).toContainText(CORRECTED_VALUE, {
      timeout: 30_000,
    });
    await expect(reloadedField).toContainText("Edited");
    await expect(reloadedField).toContainText("AI:");
  },
);
