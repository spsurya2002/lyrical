import { log } from '../api/middleware/errors.js';
import {
  fetchSiblingOccurrences,
  fetchWordMeaning,
} from '../db/queries/wordMeaning.js';
import { assessGrounding } from '../domain/grounding.js';
import { scriptForMode, type Mode } from '../domain/modeScript.js';
import { validateScript } from '../domain/scriptValidator.js';

/**
 * A single word's meaning, as used in THIS song.
 *
 * The hard part is `differs`. Two occurrences of the same spelling may share a
 * meaning or carry different ones, and the page must be able to say which —
 * without claiming a difference that is not there. Comparing meaning ids is the
 * only honest test: same meaning row means the same sense, full stop.
 */

export class WordMeaningNotFound extends Error {}

export interface SiblingView {
  occurrenceId: string;
  lineNo: number;
  differs: boolean;
}

export interface WordMeaningResponse {
  occurrenceId: string;
  surface: string;
  lineNo: number;
  meaning: { meaningId: string; text: string; sourceCount: number };
  otherOccurrences: SiblingView[];
  /** True when at least one other occurrence in this song means something else. */
  hasDivergentUses: boolean;
}

export async function getWordMeaning(
  occurrenceId: string,
  mode: Mode,
): Promise<WordMeaningResponse> {
  const script = scriptForMode(mode);

  const row = await fetchWordMeaning(occurrenceId, script, mode);
  if (row === null) throw new WordMeaningNotFound(occurrenceId);

  const hasRendering = row.meaningText !== null && row.meaningId !== null;
  const state = assessGrounding(row.sourceCount, hasRendering);
  if (!state.servable || row.meaningId === null || row.meaningText === null) {
    // A word below the bar is not presented as selectable in the first place
    // (FR-020), so reaching here means a direct request for something the page
    // would not have offered. There is nothing honest to return.
    throw new WordMeaningNotFound(occurrenceId);
  }

  // The output boundary, same as the page (R-07).
  const validation = validateScript(row.meaningText, mode);
  if (!validation.ok) {
    log.error('word meaning failed script validation at output boundary', {
      occurrenceId,
      mode,
      violations: validation.violations.map((v) => v.kind),
    });
    throw new WordMeaningNotFound(occurrenceId);
  }

  const siblings = await fetchSiblingOccurrences(occurrenceId, script);
  const otherOccurrences: SiblingView[] = siblings.map((sibling) => ({
    occurrenceId: sibling.occurrenceId,
    lineNo: sibling.lineNo,
    // A sibling with no servable meaning is not a DIFFERENT meaning — it is an
    // unknown one. Calling it different would assert something no source says.
    differs:
      assessGrounding(sibling.sourceCount).servable &&
      sibling.meaningId !== null &&
      sibling.meaningId !== row.meaningId,
  }));

  return {
    occurrenceId: row.occurrenceId,
    surface: row.surface,
    lineNo: row.lineNo,
    meaning: {
      meaningId: row.meaningId,
      text: row.meaningText,
      sourceCount: row.sourceCount,
    },
    otherOccurrences,
    hasDivergentUses: otherOccurrences.some((o) => o.differs),
  };
}
