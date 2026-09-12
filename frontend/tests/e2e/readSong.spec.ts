import { expect, test } from '@playwright/test';

/**
 * US1 — read a song and see where its meaning came from.
 * quickstart.md scenario 1. T043.
 *
 * Requires the API running and the database seeded:
 *   docker compose up -d && npm run db:migrate && npm run db:seed
 */

const PROHIBITED: ReadonlyArray<readonly [number, number]> = [
  [0x0600, 0x06ff],
  [0x0750, 0x077f],
  [0x0870, 0x089f],
  [0x08a0, 0x08ff],
  [0xfb50, 0xfdff],
  [0xfe70, 0xfeff],
];

function hasProhibitedScript(text: string): boolean {
  for (const ch of text) {
    const cp = ch.codePointAt(0);
    if (cp !== undefined && PROHIBITED.some(([lo, hi]) => cp >= lo && cp <= hi)) return true;
  }
  return false;
}

test.describe('song page', () => {
  test('shows a lyric, its meaning, and the sources behind it', async ({ page }) => {
    await page.goto('/song/kun-faya-kun');

    await expect(page.getByRole('heading', { name: 'Kun Faya Kun' })).toBeVisible();
    await expect(page.getByTestId('meaning-panel')).toBeVisible();
    await expect(page.getByTestId('meaning-text')).not.toBeEmpty();
    await expect(page.getByTestId('grounded-mark').first()).toContainText('sources');
    await expect(page.getByTestId('source-strip')).toBeVisible();
  });

  test('opens on the first explained line, not line one', async ({ page }) => {
    await page.goto('/song/kun-faya-kun');
    // Line 1 is unexplained in the fixture; opening there would show an empty
    // panel while line 2 is explained.
    await expect(page.getByTestId('lyric-line-2')).toHaveAttribute('aria-current', 'true');
    await expect(page.getByTestId('lyric-line-1')).not.toHaveAttribute('aria-current', 'true');
  });

  test('selecting a line shows that line’s meaning', async ({ page }) => {
    await page.goto('/song/kun-faya-kun');
    const before = await page.getByTestId('meaning-panel').textContent();
    await page.getByTestId('lyric-line-3').click();
    await expect(page.getByTestId('meaning-panel')).not.toHaveText(before ?? '');
  });

  test('opening a source shows the excerpt actually used', async ({ page }) => {
    await page.goto('/song/kun-faya-kun');
    await page.getByTestId('source-strip').getByRole('button').first().click();
    await expect(page.locator('blockquote')).toBeVisible();
  });

  test('says so honestly when a song falls below the source bar', async ({ page }) => {
    await page.goto('/song/piya-haji-ali');
    await expect(page.getByTestId('ungrounded-state')).toBeVisible();
    await expect(page.getByTestId('ungrounded-state')).toContainText('we need 4');
    // No meaning of any kind is offered alongside it (FR-025).
    await expect(page.getByTestId('meaning-text')).toHaveCount(0);
  });

  test('shows how much of a partly explained song is covered', async ({ page }) => {
    await page.goto('/song/arziyan');
    await expect(page.getByTestId('coverage')).toHaveText('4 of 26 lines explained');
    await expect(page.getByTestId('summary-ungrounded')).toBeVisible();
  });

  test('renders no Arabic or Urdu script anywhere on the page', async ({ page }) => {
    for (const slug of ['kun-faya-kun', 'piya-haji-ali', 'arziyan', 'tere-bina']) {
      await page.goto(`/song/${slug}`);
      const body = (await page.locator('body').textContent()) ?? '';
      expect(hasProhibitedScript(body), slug).toBe(false);
    }
  });

  test('every meaning is reachable by keyboard alone', async ({ page }) => {
    await page.goto('/song/kun-faya-kun');
    const line = page.getByTestId('lyric-line-3');
    await line.focus();
    await page.keyboard.press('Enter');
    await expect(line).toHaveAttribute('aria-current', 'true');
  });
});
