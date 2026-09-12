import type { Mode } from '../domain/modeScript.js';

/**
 * The prompt that produces a language rendering from a stored meaning.
 *
 * This is a TRANSLATION job, not an interpretation job. The meaning already
 * exists and is already grounded in sources; this turns it into one of three
 * languages. The prompt's whole purpose is to stop the model adding anything
 * the meaning does not contain — a model asked to "explain" a lyric will
 * happily invent, and that invention would inherit the source citations of the
 * text it replaced, which is the worst possible failure here.
 *
 * Script constraints are stated explicitly per mode. Never rely on the model
 * inferring script from the input: the input is often Devanagari or contains
 * Urdu-origin vocabulary, and the model will mirror what it sees.
 */

interface ModeRules {
  readonly language: string;
  readonly script: string;
  readonly guidance: string;
}

const RULES: Record<Mode, ModeRules> = {
  en: {
    language: 'English',
    script: 'Latin script only',
    guidance:
      'Plain, warm English. Explain as you would to a friend who loves the song but does not ' +
      'speak the language. Do not use academic or religious-studies vocabulary unless the ' +
      'source meaning does.',
  },
  hi: {
    language: 'Hindi',
    script: 'Devanagari script only',
    guidance:
      'Natural spoken Hindi, not Sanskritised or textbook Hindi. Write the way a Hindi ' +
      'speaker actually talks about a song.',
  },
  'hi-Latn': {
    language: 'Hindi written in Latin letters (Hinglish)',
    script: 'Latin script only — no Devanagari characters at all',
    guidance:
      'Hindi vocabulary and Hindi grammar, spelled in English letters. This is NOT English: ' +
      'do not translate the sentence into English. English loanwords a Hindi speaker actually ' +
      'says out loud (matlab, feeling, simple) are fine and natural.',
  },
};

export const RENDERING_SYSTEM_PROMPT = [
  'You render an existing explanation of a song lyric into a target language.',
  '',
  'You are NOT explaining the lyric. The explanation already exists and is already',
  'backed by sources. Your only job is to express that same explanation in the',
  'target language, keeping every claim it makes and adding none of your own.',
  '',
  'Absolute rules:',
  '- Add no interpretation, context, etymology, or detail that is not in the source text.',
  '- Remove nothing that the source text asserts.',
  '- Never write in Arabic or Urdu script, in any circumstance, for any word.',
  '  Words of Arabic or Persian origin are written in the target script instead',
  '  (fana, ishq, rabb / फ़ना, इश्क़, रब्ब).',
  '- Return only the rendered text. No preamble, no notes, no quotation marks',
  '  wrapping the whole answer.',
].join('\n');

export function buildRenderingPrompt(sourceText: string, sourceMode: Mode, target: Mode): string {
  const rules = RULES[target];
  return [
    `Target language: ${rules.language}`,
    `Script: ${rules.script}`,
    `Style: ${rules.guidance}`,
    '',
    `Here is the explanation, currently in ${RULES[sourceMode].language}:`,
    '',
    sourceText,
    '',
    `Now write exactly that explanation in ${rules.language}, ${rules.script}.`,
  ].join('\n');
}
