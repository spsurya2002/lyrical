import { expect, test } from '@playwright/test';
import { openMeaning } from './helpers.js';

/**
 * The coverage indicator and the ungrounded state, as components. T069, T070.
 *
 * Both were held back for a design round that was waived once the token system
 * had proved itself across the rest of the page. These assert the behaviour
 * that round would have dressed: the right tone for the right situation, and
 * never a scolding one.
 */

test.describe('coverage indicator', () => {
  test('marks a sparsely covered song as sparse', async ({ page }) => {
    await page.goto('/song/arziyan');
    await expect(page.getByTestId('coverage')).toHaveText('4 of 26 lines explained');
    await expect(page.locator('[data-coverage]')).toHaveAttribute('data-coverage', 'sparse');
  });

  test('marks a song with nothing explained, without alarm', async ({ page }) => {
    await page.goto('/song/piya-haji-ali');
    await expect(page.getByTestId('coverage')).toHaveText('0 of 4 lines explained');
    await expect(page.locator('[data-coverage]')).toHaveAttribute('data-coverage', 'none');
  });

  test('does not treat a mostly explained song as a problem', async ({ page }) => {
    // tere-bina has 1 of 2 lines explained — half, so not sparse.
    await page.goto('/song/tere-bina');
    await expect(page.locator('[data-coverage]')).toHaveAttribute('data-coverage', 'most');
  });

  test('reads the same in every language', async ({ page }) => {
    // A song is not better explained in Hindi than in English.
    for (const mode of ['en', 'hi', 'hi-Latn']) {
      await page.goto('/song/arziyan');
      await page.getByTestId(`mode-${mode}`).click();
      await expect(page.getByTestId('coverage')).toHaveText('4 of 26 lines explained');
    }
  });
});

test.describe('ungrounded state', () => {
  test('distinguishes falling short from having nothing', async ({ page }, testInfo) => {
    await page.goto('/song/piya-haji-ali');
    await expect(page.getByTestId('ungrounded-state')).toHaveAttribute(
      'data-reason',
      'below_bar',
    );

    await page.getByTestId('lyric-line-2').click();
    await openMeaning(page, testInfo, 2);
    await expect(page.getByTestId('ungrounded-state')).toHaveAttribute(
      'data-reason',
      'no_material',
    );
  });

  test('shows the shortfall as a count, not a vague refusal', async ({ page }) => {
    await page.goto('/song/piya-haji-ali');
    const state = page.getByTestId('ungrounded-state');
    await expect(state).toContainText('2 sources');
    await expect(state).toContainText('we need 4');
  });

  test('gives the reason in the product’s own words', async ({ page }) => {
    await page.goto('/song/piya-haji-ali');
    await expect(page.getByTestId('ungrounded-state')).toContainText(
      'rather say nothing than make something up',
    );
  });

  test('offers both ways out', async ({ page }) => {
    await page.goto('/song/piya-haji-ali');
    await expect(page.getByRole('button', { name: 'Contribute a source' })).toBeVisible();
    await expect(page.getByTestId('notify-open')).toBeVisible();
  });

  test('never says "not enough material" about a missing translation', async ({ page }) => {
    // A meaning that exists and is grounded but untranslated is a different
    // situation from one nobody has written about. Conflating them would be a
    // small lie in the direction of sounding worse than the truth.
    await page.goto('/song/piya-haji-ali');
    const states = page.getByTestId('ungrounded-state');
    await expect(states.first()).not.toHaveAttribute('data-reason', 'mode_unavailable');
  });
});
