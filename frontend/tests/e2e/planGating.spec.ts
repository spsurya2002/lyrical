import { expect, test } from '@playwright/test';

/**
 * US6 — know where you stand on your free allowance.
 * quickstart.md scenario 6. T082.
 *
 * The interface is presentation. The server refuses independently, and that is
 * proved in backend/tests/contract/entitlements.test.ts — this file only checks
 * that the reader is told the truth about what they have.
 */

test.describe('plan and quota', () => {
  test('a signed-out visitor reads the page with no meter and no chatbot', async ({ page }) => {
    // Serving a stored explanation costs almost nothing, so there is no reason
    // to put a login in front of it (R-09).
    await page.goto('/song/kun-faya-kun');
    await expect(page.getByTestId('lyric-line-1')).toBeVisible();
    await expect(page.getByTestId('quota-meter')).toHaveCount(0);
  });

  test('the chatbot is shown and gated rather than hidden', async ({ page }) => {
    await page.goto('/song/kun-faya-kun');
    const entry = page.getByTestId('chatbot-entry');

    // FR-029: a reader should see what they would get, not an absence.
    await expect(entry).toBeVisible();
    await expect(entry).toHaveAttribute('data-available', 'false');
    await expect(page.getByTestId('pro-badge')).toBeVisible();
    await expect(page.getByTestId('chatbot-open')).toBeDisabled();
  });

  test('the chatbot entry promises only what the chatbot will do', async ({ page }) => {
    // It answers from stored sources and says so when a question falls outside
    // them — the same grounding rule as the page.
    await page.goto('/song/kun-faya-kun');
    await expect(page.getByTestId('chatbot-entry')).toContainText('stored sources');
  });

  test('reading a song never moves the meter', async ({ page }) => {
    // Nothing to assert against for a signed-out reader beyond absence, so this
    // guards the shape: no counter appears and nothing decrements as they read.
    await page.goto('/song/kun-faya-kun');
    await page.getByTestId('lyric-line-2').click();
    await page.getByTestId('mode-hi').click();
    await page.getByTestId('mode-en').click();
    await expect(page.getByTestId('quota-meter')).toHaveCount(0);
  });
});
