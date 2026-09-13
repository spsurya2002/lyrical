import { expect, test } from '@playwright/test';

/**
 * US3 — what one particular word means HERE.
 * quickstart.md scenario 3. T064.
 */

test.describe('word meanings', () => {
  test('selecting a word shows its meaning in this song', async ({ page }) => {
    await page.goto('/song/kun-faya-kun');
    const word = page.locator('[data-testid^="word-"]').first();
    await expect(word).toBeVisible();
    await word.click();

    await expect(page.getByTestId('word-gloss')).toBeVisible();
    await expect(page.getByTestId('word-meaning-text')).not.toBeEmpty();
    // Every assertion the product makes carries its sources.
    await expect(page.getByTestId('source-strip')).toBeVisible();
  });

  test('a word is reachable even on a line with no meaning of its own', async ({ page }) => {
    // Under per-line honesty this is the normal case, not an edge case.
    await page.goto('/song/khwaja-mere-khwaja');
    await expect(page.getByTestId('ungrounded-state')).toBeVisible();

    const word = page.locator('[data-testid^="word-"]').first();
    await expect(word).toBeVisible();
    await word.click();
    await expect(page.getByTestId('word-meaning-text')).not.toBeEmpty();
  });

  test('the same word in two lines gives two different meanings', async ({ page }) => {
    await page.goto('/song/khwaja-mere-khwaja');
    const words = page.locator('[data-testid^="word-"]');
    await expect(words).toHaveCount(2);

    await words.nth(0).click();
    const first = await page.getByTestId('word-meaning-text').textContent();

    // On mobile the open sheet covers the lower lyric; the page pads to let it
    // scroll clear, and Playwright scrolls into view before clicking.
    await words.nth(1).scrollIntoViewIfNeeded();
    await words.nth(1).click();
    await expect(page.getByTestId('word-meaning-text')).not.toHaveText(first ?? '');
  });

  test('says plainly when the same word is used differently elsewhere', async ({ page }) => {
    await page.goto('/song/khwaja-mere-khwaja');
    await page.locator('[data-testid^="word-"]').first().click();
    await expect(page.getByTestId('divergent-uses')).toBeVisible();
    await expect(page.getByTestId('divergent-uses')).toContainText('meaning something different');
  });

  test('does not claim a difference when the word appears once', async ({ page }) => {
    await page.goto('/song/kun-faya-kun');
    await page.locator('[data-testid^="word-"]').first().click();
    await expect(page.getByTestId('word-gloss')).toBeVisible();
    await expect(page.getByTestId('divergent-uses')).toHaveCount(0);
  });

  test('returns to the line meaning when dismissed', async ({ page }) => {
    await page.goto('/song/kun-faya-kun');
    await page.locator('[data-testid^="word-"]').first().click();
    await expect(page.getByTestId('word-gloss')).toBeVisible();

    await page.keyboard.press('Escape');
    // Escape dismisses the word gloss on desktop; on mobile it closes the whole
    // sheet, which also dismisses the word. Either way the gloss is gone.
    await expect(page.getByTestId('word-gloss')).toHaveCount(0);
  });

  test('selecting a different line clears the open word', async ({ page }) => {
    await page.goto('/song/kun-faya-kun');
    await page.locator('[data-testid^="word-"]').first().click();
    await expect(page.getByTestId('word-gloss')).toBeVisible();

    // The panel shows one thing at a time.
    await page.getByTestId('lyric-line-1').click();
    await expect(page.getByTestId('word-gloss')).toHaveCount(0);
  });

  test('word targets are tall enough to hit on a touch screen', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'touch target sizing is a mobile concern');
    await page.goto('/song/kun-faya-kun');
    const box = await page.locator('[data-testid^="word-"]').first().boundingBox();
    expect(box).not.toBeNull();
    // FR-032: achieved with padding, never by shrinking the text.
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(36);
  });
});
