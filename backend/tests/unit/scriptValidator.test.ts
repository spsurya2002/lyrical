import { describe, expect, it } from 'vitest';
import { validateFields, validateScript } from '../../src/domain/scriptValidator.js';

/**
 * Fixtures use real qawwali vocabulary, not foo/bar — the failure modes this
 * guards against only appear with genuine Arabic-origin Hindi/Urdu content.
 *
 * The Urdu-script strings below are exactly what a scraped source contains.
 * They are legal to STORE and must never be EMITTED.
 */
const URDU_SOURCE_EXCERPT = 'کن فیا کن — امر الٰہی کی طرف اشارہ ہے';
const ARABIC_WORD_FANA = 'فنا';
const ARABIC_WORD_ISHQ = 'عشق';

describe('validateScript — prohibited scripts', () => {
  it('rejects Arabic script in English mode', () => {
    const result = validateScript(`The word ${ARABIC_WORD_FANA} means annihilation`, 'en');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.violations[0]?.kind).toBe('prohibited_script');
  });

  it('rejects Arabic script in Hindi mode', () => {
    const result = validateScript(`${ARABIC_WORD_ISHQ} का अर्थ है प्रेम`, 'hi');
    expect(result.ok).toBe(false);
  });

  it('rejects Arabic script in Hinglish mode', () => {
    const result = validateScript(`${ARABIC_WORD_ISHQ} ka matlab hai prem`, 'hi-Latn');
    expect(result.ok).toBe(false);
  });

  it('rejects a stored Urdu source excerpt in every mode', () => {
    for (const mode of ['en', 'hi', 'hi-Latn'] as const) {
      expect(validateScript(URDU_SOURCE_EXCERPT, mode).ok).toBe(false);
    }
  });

  it('reports every violation, not only the first', () => {
    const result = validateScript(`${ARABIC_WORD_FANA} and ${ARABIC_WORD_ISHQ}`, 'en');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    // 3 codepoints in fana + 3 in ishq
    expect(result.violations.length).toBeGreaterThan(1);
  });

  it('names the block and gives context, so a fix is findable', () => {
    const result = validateScript(`Kun faya kun ${ARABIC_WORD_FANA}`, 'en');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    const first = result.violations[0];
    expect(first?.kind).toBe('prohibited_script');
    if (first?.kind !== 'prohibited_script') return;
    expect(first.block).toBe('Arabic');
    expect(first.sample).toContain('Kun faya kun');
  });

  it('rejects Arabic Presentation Forms, not only the base block', () => {
    // U+FEF1 — Arabic Presentation Forms-B. A different range, same prohibition.
    expect(validateScript('word ﻱ here', 'en').ok).toBe(false);
  });
});

describe('validateScript — correct script per mode', () => {
  it('accepts romanized Hindi in Hinglish mode', () => {
    const text = 'Kun Faya Kun ka matlab hai — "Ho ja, aur woh ho jaata hai".';
    expect(validateScript(text, 'hi-Latn').ok).toBe(true);
  });

  it('accepts Devanagari in Hindi mode', () => {
    const text = 'कुन फ़या कुन का अर्थ है — "हो जा, तो वह हो जाता है"।';
    expect(validateScript(text, 'hi').ok).toBe(true);
  });

  it('accepts plain English in English mode', () => {
    expect(validateScript('Be, and it is — God’s command alone suffices.', 'en').ok).toBe(true);
  });

  it('rejects Devanagari in English mode', () => {
    const result = validateScript('The word फ़ना means annihilation', 'en');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.violations.some((v) => v.kind === 'devanagari_in_latin_mode')).toBe(true);
  });

  it('rejects Devanagari in Hinglish mode', () => {
    const result = validateScript('Fana ka matlab है khatm ho jaana', 'hi-Latn');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.violations.some((v) => v.kind === 'devanagari_in_latin_mode')).toBe(true);
  });

  it('rejects a Hindi payload that is actually written in Latin', () => {
    // The model answered in Hinglish when Hindi was asked for. No character is
    // prohibited, but the payload is still wrong for the mode.
    const result = validateScript('Kun faya kun ka matlab hai ho ja aur woh ho jaata hai', 'hi');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.violations.some((v) => v.kind === 'hi_not_devanagari')).toBe(true);
  });

  it('allows a romanized proper noun inside otherwise Devanagari Hindi', () => {
    const text = 'ए.आर. रहमान का यह गीत Rockstar फ़िल्म से है, जो सूफ़ी परंपरा में गहरा है।';
    expect(validateScript(text, 'hi').ok).toBe(true);
  });
});

describe('validateScript — edge cases', () => {
  it('accepts empty text', () => {
    for (const mode of ['en', 'hi', 'hi-Latn'] as const) {
      expect(validateScript('', mode).ok).toBe(true);
    }
  });

  it('does not split characters outside the BMP into surrogate halves', () => {
    expect(validateScript('Kun faya kun 🎵', 'en').ok).toBe(true);
  });

  it('accepts Devanagari conjuncts with nukta and matras', () => {
    // ख़्वाजा exercises nukta, virama and a matra together.
    expect(validateScript('ख़्वाजा मेरे ख़्वाजा', 'hi').ok).toBe(true);
  });
});

describe('validateFields — the serialisation boundary', () => {
  it('names which field failed, so one bad line does not condemn the page', () => {
    const result = validateFields(
      [
        { path: 'lines[0].meaning.text', text: 'Be, and it is.' },
        { path: 'lines[1].meaning.text', text: `Means ${ARABIC_WORD_FANA}` },
        { path: 'summary.text', text: 'A song about surrender.' },
      ],
      'en',
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.failures).toHaveLength(1);
    expect(result.failures[0]?.path).toBe('lines[1].meaning.text');
  });

  it('passes a wholly clean payload', () => {
    const result = validateFields(
      [
        { path: 'title', text: 'Kun Faya Kun' },
        { path: 'lines[0].text', text: 'Ya nizaam-ud-din auliya' },
      ],
      'en',
    );
    expect(result.ok).toBe(true);
  });

  it('catches Urdu script hiding in a source excerpt', () => {
    // The realistic leak: the meaning is clean, the quoted source is not.
    const result = validateFields(
      [
        { path: 'meaning.text', text: 'A phrase carried into filmi verse from scripture.' },
        { path: 'sources[0].excerpt', text: URDU_SOURCE_EXCERPT },
      ],
      'en',
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.failures[0]?.path).toBe('sources[0].excerpt');
  });
});
