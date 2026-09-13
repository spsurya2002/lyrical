import { expect, test } from '@playwright/test';
import { openMeaning } from './helpers.js';

/**
 * US4 — be told honestly when the tool doesn't know.
 * quickstart.md scenario 4. T072.
 *
 * This is the visible proof of the product's central promise, so it is tested
 * as a feature rather than as an error path.
 */

test.describe('honest gaps', () => {
  test('shows the lyric and no meaning at all when a song is below the bar', async ({ page }) => {
    await page.goto('/song/piya-haji-ali');

    await expect(page.getByTestId('ungrounded-state')).toBeVisible();
    // FR-025: no partial or hedged meaning accompanies the refusal.
    await expect(page.getByTestId('meaning-text')).toHaveCount(0);
    // The lyric is still there — we withhold the explanation, not the song.
    await expect(page.getByTestId('lyric-line-1')).toBeVisible();
  });

  test('discloses the shortfall rather than only refusing (FR-037)', async ({ page }) => {
    await page.goto('/song/piya-haji-ali');
    const state = page.getByTestId('ungrounded-state');
    await expect(state).toContainText('2 sources');
    await expect(state).toContainText('we need 4');
  });

  test('says why, in the product’s own voice', async ({ page }) => {
    await page.goto('/song/piya-haji-ali');
    await expect(page.getByTestId('ungrounded-state')).toContainText(
      'rather say nothing than make something up',
    );
  });

  test('offers both a contribution and a notify path', async ({ page }) => {
    await page.goto('/song/piya-haji-ali');
    await expect(page.getByRole('button', { name: 'Contribute a source' })).toBeVisible();
    await expect(page.getByTestId('notify-open')).toBeVisible();
  });

  test('records a notify request and says only that it was recorded', async ({ page }) => {
    await page.goto('/song/piya-haji-ali');
    await page.getByTestId('notify-open').click();
    await page.getByTestId('notify-email').fill('e2e-reader@example.test');
    await page.getByTestId('notify-submit').click();

    // Delivery is not built, so the copy must not promise an email will arrive.
    await expect(page.getByTestId('notify-done')).toBeVisible();
    await expect(page.getByTestId('notify-done')).toContainText('recorded');
  });

  test('explains some lines and marks the rest on a partly grounded song', async ({ page }, testInfo) => {
    await page.goto('/song/arziyan');
    await expect(page.getByTestId('coverage')).toHaveText('4 of 26 lines explained');

    // The opening line is a grounded one, not line 1.
    await expect(page.getByTestId('lyric-line-3')).toHaveAttribute('aria-current', 'true');
    await openMeaning(page, testInfo);
    await expect(page.getByTestId('meaning-text')).not.toBeEmpty();

    // And an unexplained line says so rather than showing nothing.
    await page.getByTestId('lyric-line-1').click();
    await expect(page.getByTestId('ungrounded-state')).toBeVisible();
    await expect(page.getByTestId('meaning-text')).toHaveCount(0);
  });

  test('unexplained lines are marked in the lyric column itself', async ({ page }) => {
    await page.goto('/song/arziyan');
    await expect(page.getByTestId('lyric-line-1')).toHaveAttribute('data-explained', 'false');
    await expect(page.getByTestId('lyric-line-3')).toHaveAttribute('data-explained', 'true');
  });

  test('withholds a song summary that is not itself grounded (FR-024)', async ({ page }) => {
    // arziyan has explained lines but no grounded summary: one assembled from
    // four lines out of twenty-six would be a guess.
    await page.goto('/song/arziyan');
    await expect(page.getByTestId('summary-ungrounded')).toBeVisible();
    await expect(page.getByTestId('song-summary')).toHaveCount(0);
  });

  test('keeps a stale explanation readable while it is replaced (FR-007)', async ({ page }, testInfo) => {
    await page.goto('/song/tere-bina');
    await openMeaning(page, testInfo);
    await expect(page.getByTestId('meaning-text')).not.toBeEmpty();
    await expect(page.getByTestId('grounded-mark').first()).toContainText('updating');
  });

  test('is honest in every language, not only English', async ({ page }) => {
    for (const mode of ['en', 'hi', 'hi-Latn']) {
      await page.goto('/song/piya-haji-ali');
      await page.getByTestId(`mode-${mode}`).click();
      await expect(page.getByTestId('ungrounded-state')).toBeVisible();
      await expect(page.getByTestId('meaning-text')).toHaveCount(0);
    }
  });
});
