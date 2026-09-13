import type { Page, TestInfo } from '@playwright/test';

/**
 * On a phone the meaning lives in a bottom sheet that opens on tap, so the song
 * is visible before its explanation covers it. On desktop the panel is simply
 * there. Tests that assert on meaning content need the sheet opened first when
 * running in the mobile project.
 *
 * The one exception is a song with nothing grounded: there the sheet opens on
 * arrival, because FR-022 requires the page to say so without being asked.
 */
export async function openMeaning(
  page: Page,
  testInfo: TestInfo,
  lineNo?: number,
): Promise<void> {
  if (testInfo.project.name !== 'mobile') return;

  if (lineNo !== undefined) {
    await page.getByTestId(`lyric-line-${lineNo}`).click();
    return;
  }

  // Wait for the page to have CHOSEN its opening line before tapping anything.
  // Without this the helper raced the first render, found no active line, and
  // fell back to line 1 — which on most fixtures is ungrounded, so the test
  // then looked for a meaning that was never going to be there.
  const active = page.locator('[data-testid^="lyric-line-"][aria-current="true"]').first();
  await active.waitFor({ state: 'visible' });

  // A song with nothing grounded opens its sheet on arrival (FR-022); tapping
  // again would close it.
  if (await page.getByTestId('meaning-sheet').isVisible()) return;

  await active.click();
}

/** Prohibited script ranges, declared numerically — never as a character class. */
export const PROHIBITED_RANGES: ReadonlyArray<readonly [number, number]> = [
  [0x0600, 0x06ff],
  [0x0750, 0x077f],
  [0x0870, 0x089f],
  [0x08a0, 0x08ff],
  [0xfb50, 0xfdff],
  [0xfe70, 0xfeff],
];

export const DEVANAGARI_RANGES: ReadonlyArray<readonly [number, number]> = [[0x0900, 0x097f]];

export function anyIn(text: string, ranges: ReadonlyArray<readonly [number, number]>): boolean {
  for (const ch of text) {
    const cp = ch.codePointAt(0);
    if (cp !== undefined && ranges.some(([lo, hi]) => cp >= lo && cp <= hi)) return true;
  }
  return false;
}
