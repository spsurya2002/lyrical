import { expect, test } from '@playwright/test';

/**
 * Every meaning reachable and dismissible by keyboard alone. FR-033, SC-009.
 * T083, T085.
 *
 * This is long-form reading with hundreds of small targets in it. Someone who
 * cannot use a pointer still has to get through the whole song, so the keyboard
 * path is the layout's real test rather than an accessibility afterthought.
 */

test.describe('keyboard', () => {
  test('Enter selects a lyric line', async ({ page }) => {
    await page.goto('/song/kun-faya-kun');
    const line = page.getByTestId('lyric-line-3');
    await line.focus();
    await page.keyboard.press('Enter');
    await expect(line).toHaveAttribute('aria-current', 'true');
  });

  test('Space selects a lyric line', async ({ page }) => {
    // A row behaving as a button has to answer to both keys, or it only half is.
    await page.goto('/song/kun-faya-kun');
    const line = page.getByTestId('lyric-line-4');
    await line.focus();
    await page.keyboard.press(' ');
    await expect(line).toHaveAttribute('aria-current', 'true');
  });

  test('Space on a line does not scroll the page', async ({ page }) => {
    await page.goto('/song/allah-hoo');
    const before = await page.evaluate(() => window.scrollY);
    await page.getByTestId('lyric-line-3').focus();
    await page.keyboard.press(' ');
    expect(await page.evaluate(() => window.scrollY)).toBe(before);
  });

  test('a word meaning opens and dismisses without a pointer', async ({ page }) => {
    await page.goto('/song/kun-faya-kun');
    const word = page.locator('[data-testid^="word-"]').first();
    await word.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('word-gloss')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByTestId('word-gloss')).toHaveCount(0);
  });

  test('tabbing reaches the lyric, then the words inside it', async ({ page }) => {
    await page.goto('/song/kun-faya-kun');
    await page.getByTestId('lyric-line-2').focus();
    await page.keyboard.press('Tab');

    // The word buttons sit inside their line, so tab order runs line then words
    // rather than skipping the song's interactive content entirely.
    const focused = await page.evaluate(() =>
      document.activeElement?.getAttribute('data-testid'),
    );
    expect(focused).toMatch(/^word-/);
  });

  test('focus is visible when moving by keyboard', async ({ page }) => {
    await page.goto('/song/kun-faya-kun');
    await page.getByTestId('lyric-line-2').focus();
    await page.keyboard.press('Tab');

    const outline = await page.evaluate(() => {
      const el = document.activeElement;
      if (el === null) return null;
      const style = window.getComputedStyle(el);
      return { width: style.outlineWidth, style: style.outlineStyle };
    });

    // Never removed without a replacement (design_system.md §10).
    expect(outline?.style).not.toBe('none');
    expect(parseFloat(outline?.width ?? '0')).toBeGreaterThan(0);
  });

  test('works the same in every language', async ({ page }) => {
    for (const mode of ['en', 'hi', 'hi-Latn']) {
      await page.goto('/song/kun-faya-kun');
      await page.getByTestId(`mode-${mode}`).click();

      const line = page.getByTestId('lyric-line-3');
      await line.focus();
      await page.keyboard.press('Enter');
      await expect(line, `Enter in ${mode}`).toHaveAttribute('aria-current', 'true');
    }
  });

  test('the language switch is reachable and operable by keyboard', async ({ page }) => {
    await page.goto('/song/kun-faya-kun');
    await page.getByTestId('mode-hi').focus();
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('mode-hi')).toHaveAttribute('aria-pressed', 'true');
  });

  test('Devanagari is tagged so a screen reader switches voice (FR-034)', async ({ page }) => {
    await page.goto('/song/kun-faya-kun');
    await page.getByTestId('mode-hi').click();
    await expect(page.locator('ol[lang]')).toHaveAttribute('lang', 'hi');

    await page.getByTestId('mode-hi-Latn').click();
    // Hinglish is Hindi in Latin letters, so it is hi-Latn — not en.
    await expect(page.locator('ol[lang]')).toHaveAttribute('lang', 'hi-Latn');
  });
});
