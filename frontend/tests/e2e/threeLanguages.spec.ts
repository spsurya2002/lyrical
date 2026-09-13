import { expect, test } from '@playwright/test';
import { openMeaning } from './helpers.js';

/**
 * US2 — read the same song in Hindi or Hinglish.
 * quickstart.md scenario 2. T053, T056.
 */

const PROHIBITED: ReadonlyArray<readonly [number, number]> = [
  [0x0600, 0x06ff],
  [0x0750, 0x077f],
  [0x0870, 0x089f],
  [0x08a0, 0x08ff],
  [0xfb50, 0xfdff],
  [0xfe70, 0xfeff],
];
const DEVANAGARI: ReadonlyArray<readonly [number, number]> = [[0x0900, 0x097f]];

function anyIn(text: string, ranges: ReadonlyArray<readonly [number, number]>): boolean {
  for (const ch of text) {
    const cp = ch.codePointAt(0);
    if (cp !== undefined && ranges.some(([lo, hi]) => cp >= lo && cp <= hi)) return true;
  }
  return false;
}

test.describe('three languages', () => {
  test('offers exactly three modes, no fourth', async ({ page }) => {
    await page.goto('/song/kun-faya-kun');
    const buttons = page.getByTestId('mode-switch').getByRole('button');
    await expect(buttons).toHaveCount(3);
  });

  test('Hindi renders Devanagari throughout', async ({ page }) => {
    await page.goto('/song/kun-faya-kun');
    await page.getByTestId('mode-hi').click();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('कुन');

    const body = (await page.locator('body').textContent()) ?? '';
    expect(anyIn(body, DEVANAGARI)).toBe(true);
  });

  test('Hinglish is Hindi in Latin letters, with no Devanagari', async ({ page }, testInfo) => {
    await page.goto('/song/kun-faya-kun');
    await openMeaning(page, testInfo);
    await page.getByTestId('mode-hi-Latn').click();

    // Wait for the Hinglish rendering to actually arrive. The previous language
    // stays on screen until it does — that is the no-loading-state tradeoff
    // (FR-014), so an immediate read would see the old text.
    await expect(page.getByTestId('meaning-text')).toContainText('vaakya');

    const meaning = (await page.getByTestId('meaning-text').textContent()) ?? '';
    expect(anyIn(meaning, DEVANAGARI)).toBe(false);
  });

  test('English shows no Devanagari after coming back from Hindi', async ({ page }, testInfo) => {
    await page.goto('/song/kun-faya-kun');
    await openMeaning(page, testInfo);
    await page.getByTestId('mode-hi').click();
    await expect(page.getByTestId('meaning-text')).toContainText('धर्मग्रंथ');

    await page.getByTestId('mode-en').click();
    await expect(page.getByTestId('meaning-text')).toContainText('scripture');

    const meaning = (await page.getByTestId('meaning-text').textContent()) ?? '';
    expect(anyIn(meaning, DEVANAGARI)).toBe(false);
  });

  test('keeps the active line across a switch (FR-013)', async ({ page }) => {
    await page.goto('/song/arziyan');
    await page.getByTestId('lyric-line-12').click();
    await expect(page.getByTestId('lyric-line-12')).toHaveAttribute('aria-current', 'true');

    for (const mode of ['hi', 'hi-Latn', 'en']) {
      await page.getByTestId(`mode-${mode}`).click();
      // Losing the reader's place on every switch would make the feature
      // unusable on a long song — which is exactly where it matters most.
      await expect(page.getByTestId('lyric-line-12')).toHaveAttribute('aria-current', 'true');
    }
  });

  test('never shows a loading state while switching (FR-014)', async ({ page }, testInfo) => {
    await page.goto('/song/kun-faya-kun');
    await openMeaning(page, testInfo);
    await expect(page.getByTestId('meaning-text')).toBeVisible();

    for (const mode of ['hi', 'hi-Latn', 'en']) {
      await page.getByTestId(`mode-${mode}`).click();
      // The previous rendering stays on screen until the next one arrives, so
      // the meaning is never absent mid-switch.
      await expect(page.getByTestId('meaning-text')).toBeVisible();
    }
  });

  test('remembers the chosen mode on the next visit (FR-016)', async ({ page }) => {
    await page.goto('/song/kun-faya-kun');
    await page.getByTestId('mode-hi').click();
    await expect(page.getByTestId('mode-hi')).toHaveAttribute('aria-pressed', 'true');

    await page.goto('/song/arziyan');
    await expect(page.getByTestId('mode-hi')).toHaveAttribute('aria-pressed', 'true');
  });

  test('renders no Arabic or Urdu script in any mode, on any song', async ({ page }) => {
    for (const slug of ['kun-faya-kun', 'piya-haji-ali', 'arziyan', 'tere-bina']) {
      for (const mode of ['en', 'hi', 'hi-Latn']) {
        await page.goto(`/song/${slug}`);
        await page.getByTestId(`mode-${mode}`).click();
        const body = (await page.locator('body').textContent()) ?? '';
        expect(anyIn(body, PROHIBITED), `${slug} in ${mode}`).toBe(false);
      }
    }
  });
});
