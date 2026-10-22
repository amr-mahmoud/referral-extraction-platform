import { test } from '@e2e-dev/web';
import { credentials, expect } from 'e2e';

const SAMPLE_REFERRAL_PDF_PATH =
  process.env.E2E_SAMPLE_PDF ??
  '/Users/amrhazem/Desktop/Medical Documents/Patricia Henderson.pdf';
const SAMPLE_REFERRAL_FILE_NAME = 'Patricia Henderson.pdf';

// Extraction can take a minute or more (S3 -> SQS -> Gemini -> Postgres -> SSE).
const EXTRACTION_TIMEOUT_MS = 5 * 60_000;

test(
  'a clinic uploads a referral PDF and watches it reach Completed',
  { timeout: EXTRACTION_TIMEOUT_MS + 60_000, tags: ['upload', 'state-changing'] },
  async ({ app, screen, browser }) => {
    // Test-safety guard: writes to S3 + Postgres, so local targets only.
    const baseUrl = app.baseUrl ?? '';
    const isLocalTarget = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/.test(baseUrl);
    if (!isLocalTarget) {
      throw new Error(`Refusing to run a state-changing test against non-local target: ${baseUrl}`);
    }

    const clinicAccount = credentials.user('clinic');

    // 1. Sign in
    await app.open('/auth');
    await expect(screen.getByRole('heading', 'Sign in to your clinic')).toBeVisible();
    await screen.getByLabel('Username').fill(clinicAccount.username);
    await screen.getByLabel('Password').fill(clinicAccount.password);
    await screen.getByRole('button', 'Sign in').tap();
    await expect(browser).toHaveURL(/\/dashboard/);

    // 2. Attach the PDF (default schema is preselected)
    await browser.locator('input[type=file]').setInputFiles([SAMPLE_REFERRAL_PDF_PATH]);
    await expect(screen.getByText(SAMPLE_REFERRAL_FILE_NAME).first()).toBeVisible();

    // 3. Press Upload & extract
    const extractButton = screen.getByRole('button', 'Upload & extract 1 file');
    await expect(extractButton).toBeEnabled();
    await extractButton.tap();

    // 4. The document gets uploaded
    await expect(screen.getByText('Documents uploaded').first()).toBeVisible({ timeout: 60_000 });

    // 5. Status changes until Completed (rows are sorted newest-first)
    const referralRow = screen
      .getByRole('button')
      .filter({ hasText: SAMPLE_REFERRAL_FILE_NAME })
      .first();
    await expect(referralRow).toBeVisible({ timeout: 30_000 });
    await expect(referralRow).toHaveAttribute('data-status', 'COMPLETED', {
      timeout: EXTRACTION_TIMEOUT_MS,
    });
    await expect(referralRow).toContainText(/completed/i);
  },
);
