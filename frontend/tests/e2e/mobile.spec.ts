import { expect, test } from '@playwright/test';

/**
 * US5 — read comfortably on a phone.
 * quickstart.md scenario 5. T073–T076.
 *
 * Most people hear a song and reach for their phone, so this is the majority
 * reading experience rather than a fallback.
 */

test.describe('mobile', () => {
  // The describe-level `test.skip(callback)` does not receive testInfo — the
  // second argument is undefined there. beforeEach does. Playwright also
  // requires the first argument to be a destructuring pattern even when no
  // fixture is needed, hence the empty one.
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'mobile layout only');
  });

  test('the meaning is not shown until the reader asks for it', async ({ page }) => {
    await page.goto('/song/kun-faya-kun');
    // The song arrives first. Covering it before it has been seen would defeat
    // the point of both the lyric and the explanation.
    await expect(page.getByTestId('lyric-line-1')).toBeVisible();
    await expect(page.getByTestId('meaning-sheet')).toHaveCount(0);
  });

  test('tapping a line raises the sheet without burying the lyric', async ({ page }) => {
    await page.goto('/song/kun-faya-kun');
    await page.getByTestId('lyric-line-2').click();

    const sheet = page.getByTestId('meaning-sheet');
    await expect(sheet).toBeVisible();
    await expect(page.getByTestId('meaning-text')).not.toBeEmpty();

    // FR-031: part of the lyric stays visible above it.
    const viewport = page.viewportSize();
    const box = await sheet.boundingBox();
    expect(box).not.toBeNull();
    expect(box?.height ?? 0).toBeLessThan((viewport?.height ?? 0) * 0.85);
    await expect(page.getByTestId('lyric-line-1')).toBeVisible();
  });

  test('the sheet grows and shrinks between two heights', async ({ page }) => {
    await page.goto('/song/kun-faya-kun');
    await page.getByTestId('lyric-line-2').click();

    const sheet = page.getByTestId('meaning-sheet');
    await expect(sheet).toHaveAttribute('data-height', 'half');

    await page.getByTestId('sheet-grabber').click();
    await expect(sheet).toHaveAttribute('data-height', 'tall');

    await page.getByTestId('sheet-grabber').click();
    await expect(sheet).toHaveAttribute('data-height', 'half');
  });

  test('the sheet dismisses, and the lyric returns with the line still active', async ({
    page,
  }) => {
    await page.goto('/song/kun-faya-kun');
    await page.getByTestId('lyric-line-2').click();
    await expect(page.getByTestId('meaning-sheet')).toBeVisible();

    await page.getByTestId('sheet-close').click();
    await expect(page.getByTestId('meaning-sheet')).toHaveCount(0);
    await expect(page.getByTestId('lyric-line-2')).toHaveAttribute('aria-current', 'true');
  });

  test('Escape closes the sheet', async ({ page }) => {
    await page.goto('/song/kun-faya-kun');
    await page.getByTestId('lyric-line-2').click();
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('meaning-sheet')).toHaveCount(0);
  });

  test('lines below the open sheet can still be reached', async ({ page }) => {
    // Without room to scroll past it, the lyric underneath is unreachable —
    // the sheet would have taken away half the song.
    await page.goto('/song/arziyan');
    await page.getByTestId('lyric-line-3').click();
    await expect(page.getByTestId('meaning-sheet')).toBeVisible();

    const deepLine = page.getByTestId('lyric-line-24');
    await deepLine.scrollIntoViewIfNeeded();
    await deepLine.click();
    await expect(deepLine).toHaveAttribute('aria-current', 'true');
  });

  test('a song with nothing grounded says so on arrival (FR-022)', async ({ page }) => {
    // The one case where the sheet opens unasked: there is no reading
    // experience to interrupt, and leaving the admission behind a tap would be
    // a quiet way of not making it.
    await page.goto('/song/piya-haji-ali');
    await expect(page.getByTestId('meaning-sheet')).toBeVisible();
    await expect(page.getByTestId('ungrounded-state')).toBeVisible();
  });

  test('word targets do not collide with their neighbours', async ({ page }) => {
    await page.goto('/song/khwaja-mere-khwaja');
    const words = page.locator('[data-testid^="word-"]');
    await expect(words).toHaveCount(2);

    for (const word of await words.all()) {
      const box = await word.boundingBox();
      // FR-032: reached with padding, never by shrinking the text.
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(36);
    }
  });

  test('the page never scrolls sideways', async ({ page }) => {
    await page.goto('/song/arziyan');
    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    expect(overflows).toBe(false);
  });
});
