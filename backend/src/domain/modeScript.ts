/**
 * The three output modes, and the script each one renders in.
 *
 * Note there are three modes but only TWO scripts: English and Hinglish both
 * render Latin. That is why lyric text is stored by script rather than by mode
 * (research.md R-01) — storing three copies would mean two must be kept
 * identical forever, and the first drift shows different lyrics in two modes.
 */

export const MODES = ['en', 'hi', 'hi-Latn'] as const;
export type Mode = (typeof MODES)[number];

export const SCRIPTS = ['deva', 'latn'] as const;
export type Script = (typeof SCRIPTS)[number];

const MODE_TO_SCRIPT: Record<Mode, Script> = {
  en: 'latn',
  hi: 'deva',
  'hi-Latn': 'latn',
};

export function scriptForMode(mode: Mode): Script {
  return MODE_TO_SCRIPT[mode];
}

export function isMode(value: unknown): value is Mode {
  return typeof value === 'string' && (MODES as readonly string[]).includes(value);
}

/**
 * The BCP-47 tag for this mode, used for `lang` attributes so screen readers
 * switch voice (FR-034). Hinglish is Hindi written in Latin script, so it is
 * `hi-Latn` — not `en`.
 */
const MODE_TO_LANG: Record<Mode, string> = {
  en: 'en',
  hi: 'hi',
  'hi-Latn': 'hi-Latn',
};

export function langAttrForMode(mode: Mode): string {
  return MODE_TO_LANG[mode];
}
