/**
 * Prohibited-script detection for tests, declared NUMERICALLY.
 *
 * Do not write this as a character-class regex. Twice now, unicode escapes in
 * this project have been written into source as literal characters instead — so
 * the assertion came to contain the very thing it exists to forbid, and ESLint
 * rejected the file for irregular whitespace. Numbers cannot be pasted into a
 * page and cannot be mangled by an editor.
 */

const PROHIBITED: ReadonlyArray<readonly [number, number]> = [
  [0x0600, 0x06ff], // Arabic
  [0x0750, 0x077f], // Arabic Supplement
  [0x0870, 0x089f], // Arabic Extended-B
  [0x08a0, 0x08ff], // Arabic Extended-A
  [0xfb50, 0xfdff], // Arabic Presentation Forms-A
  [0xfe70, 0xfeff], // Arabic Presentation Forms-B
];

const DEVANAGARI: ReadonlyArray<readonly [number, number]> = [
  [0x0900, 0x097f],
  [0xa8e0, 0xa8ff],
];

function anyIn(text: string, ranges: ReadonlyArray<readonly [number, number]>): boolean {
  for (const ch of text) {
    const cp = ch.codePointAt(0);
    if (cp !== undefined && ranges.some(([lo, hi]) => cp >= lo && cp <= hi)) return true;
  }
  return false;
}

export function hasProhibitedScript(text: string): boolean {
  return anyIn(text, PROHIBITED);
}

export function hasDevanagari(text: string): boolean {
  return anyIn(text, DEVANAGARI);
}
