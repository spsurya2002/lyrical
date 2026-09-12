import { expect, test } from '@playwright/test';

/**
 * Phase 1 smoke test: proves the gate itself works end to end — the app builds,
 * serves, and renders — before any feature exists to test.
 *
 * The real journeys arrive with their user stories; see
 * specs/001-song-page-trilingual/tasks.md and quickstart.md.
 */

/**
 * Prohibited ranges are declared NUMERICALLY, never as literal characters or as
 * a regex containing them. Writing this check as a character-class regex put
 * real Arabic codepoints and a literal U+FEFF into this file — the assertion
 * would then contain the very thing it exists to forbid, and a careless copy of
 * it could leak into shipped source. Numbers cannot be pasted into a page.
 */
const PROHIBITED_RANGES: ReadonlyArray<readonly [number, number]> = [
  [0x0600, 0x06ff], // Arabic
  [0x0750, 0x077f], // Arabic Supplement
  [0x0870, 0x089f], // Arabic Extended-B
  [0x08a0, 0x08ff], // Arabic Extended-A
  [0xfb50, 0xfdff], // Arabic Presentation Forms-A
  [0xfe70, 0xfeff], // Arabic Presentation Forms-B
];

function prohibitedCodepoints(text: string): number[] {
  const found: number[] = [];
  for (const ch of text) {
    const cp = ch.codePointAt(0);
    if (cp !== undefined && PROHIBITED_RANGES.some(([lo, hi]) => cp >= lo && cp <= hi)) {
      found.push(cp);
    }
  }
  return found;
}

test('the app loads and renders', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'LyricSense' })).toBeVisible();
});

test('the page carries no Arabic or Urdu script', async ({ page }) => {
  // The full boundary test lands in T053, across all three modes and including
  // a song whose stored source genuinely is in Urdu script. This asserts the
  // invariant from the very first screen so it is never introduced quietly.
  await page.goto('/');
  const body = (await page.locator('body').textContent()) ?? '';
  expect(prohibitedCodepoints(body)).toEqual([]);
});
