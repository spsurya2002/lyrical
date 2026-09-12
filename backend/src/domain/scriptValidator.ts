import type { Mode } from './modeScript.js';

/**
 * The script boundary. Constitution Principle III, docs/language_policy.md.
 *
 * Arabic and Urdu script must never reach a user — not in headwords, lyrics,
 * glosses, summaries, chatbot replies, quoted source excerpts, metadata, page
 * titles, or alt text.
 *
 * Ingest is allowed; emit is not. Source documents scraped from the web will
 * routinely contain Urdu script — these are qawwali and ghazal songs. They are
 * stored in their original script for provenance. This function is where that
 * stops.
 *
 * Pure, no I/O. Called at the write boundary AND immediately before serialisation
 * (research.md R-07), because the pipeline that writes this data is out of scope
 * for this feature and cannot be assumed to have validated.
 */

/** Arabic and Urdu ranges — prohibited in every mode, without exception. */
const PROHIBITED_RANGES: ReadonlyArray<readonly [number, number, string]> = [
  [0x0600, 0x06ff, 'Arabic'],
  [0x0750, 0x077f, 'Arabic Supplement'],
  [0x0870, 0x089f, 'Arabic Extended-B'],
  [0x08a0, 0x08ff, 'Arabic Extended-A'],
  [0xfb50, 0xfdff, 'Arabic Presentation Forms-A'],
  [0xfe70, 0xfeff, 'Arabic Presentation Forms-B'],
];

const DEVANAGARI_RANGES: ReadonlyArray<readonly [number, number]> = [
  [0x0900, 0x097f],
  [0xa8e0, 0xa8ff],
];

/** Devanagari is expected in `hi` and forbidden in the Latin-script modes. */
const LATIN_SCRIPT_MODES: ReadonlySet<Mode> = new Set<Mode>(['en', 'hi-Latn']);

/**
 * Share of Devanagari among letter characters below which an `hi` payload is
 * considered not actually Hindi. A Hindi explanation legitimately contains some
 * Latin — a romanized proper noun, a source domain — but not mostly.
 */
const MIN_DEVANAGARI_SHARE_FOR_HI = 0.5;

export type ScriptViolation =
  | { kind: 'prohibited_script'; block: string; codepoint: number; index: number; sample: string }
  | { kind: 'devanagari_in_latin_mode'; codepoint: number; index: number; sample: string }
  | { kind: 'hi_not_devanagari'; devanagariShare: number };

export type ScriptValidationResult =
  | { ok: true }
  | { ok: false; violations: ScriptViolation[] };

function inRanges(cp: number, ranges: ReadonlyArray<readonly [number, number]>): boolean {
  return ranges.some(([lo, hi]) => cp >= lo && cp <= hi);
}

function sampleAround(text: string, index: number): string {
  return text.slice(Math.max(0, index - 24), index + 24);
}

/**
 * Validates one user-facing string for one mode.
 *
 * Returns every violation rather than the first, so a fix does not have to be
 * rediscovered one character at a time.
 */
export function validateScript(text: string, mode: Mode): ScriptValidationResult {
  const violations: ScriptViolation[] = [];

  let devanagariCount = 0;
  let latinLetterCount = 0;

  // Iterating the string yields whole code points, so characters outside the
  // BMP are not split into surrogate halves.
  let index = 0;
  for (const ch of text) {
    const cp = ch.codePointAt(0);
    if (cp === undefined) {
      index += ch.length;
      continue;
    }

    for (const [lo, hi, block] of PROHIBITED_RANGES) {
      if (cp >= lo && cp <= hi) {
        violations.push({
          kind: 'prohibited_script',
          block,
          codepoint: cp,
          index,
          sample: sampleAround(text, index),
        });
        break;
      }
    }

    if (inRanges(cp, DEVANAGARI_RANGES)) {
      devanagariCount += 1;
      if (LATIN_SCRIPT_MODES.has(mode)) {
        violations.push({
          kind: 'devanagari_in_latin_mode',
          codepoint: cp,
          index,
          sample: sampleAround(text, index),
        });
      }
    } else if ((cp >= 0x41 && cp <= 0x5a) || (cp >= 0x61 && cp <= 0x7a)) {
      latinLetterCount += 1;
    }

    index += ch.length;
  }

  // An `hi` payload that is mostly Latin is a generation failure — the model
  // answered in the wrong language — even though no character is prohibited.
  if (mode === 'hi') {
    const letters = devanagariCount + latinLetterCount;
    if (letters > 0) {
      const share = devanagariCount / letters;
      if (share < MIN_DEVANAGARI_SHARE_FOR_HI) {
        violations.push({ kind: 'hi_not_devanagari', devanagariShare: share });
      }
    }
  }

  return violations.length === 0 ? { ok: true } : { ok: false, violations };
}

/** Convenience for call sites that only need a yes/no. */
export function isScriptValid(text: string, mode: Mode): boolean {
  return validateScript(text, mode).ok;
}

/**
 * Validates several fields at once, returning which ones failed.
 * Used at the serialisation boundary, where a whole response is checked.
 */
export function validateFields(
  fields: ReadonlyArray<{ path: string; text: string }>,
  mode: Mode,
): { ok: true } | { ok: false; failures: Array<{ path: string; violations: ScriptViolation[] }> } {
  const failures: Array<{ path: string; violations: ScriptViolation[] }> = [];
  for (const field of fields) {
    const result = validateScript(field.text, mode);
    if (!result.ok) {
      failures.push({ path: field.path, violations: result.violations });
    }
  }
  return failures.length === 0 ? { ok: true } : { ok: false, failures };
}
