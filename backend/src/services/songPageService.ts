import type {
  LineView,
  MeaningView,
  SelectableWord,
  SongPageResponse,
  UngroundedView,
  ViewerView,
} from '../api/types.js';
import { log } from '../api/middleware/errors.js';
import { enqueueBackfill } from '../jobs/queue.js';
import { computeCoverage, firstServableLineNo } from '../domain/coverage.js';
import { getEntitlements, type Viewer } from '../domain/entitlements.js';
import { assessGrounding } from '../domain/grounding.js';
import { langAttrForMode, scriptForMode, type Mode } from '../domain/modeScript.js';
import { validateScript } from '../domain/scriptValidator.js';
import {
  fetchLines,
  fetchSelectableWords,
  fetchSong,
  fetchSummary,
  type LineRow,
  type WordRow,
} from '../db/queries/songPage.js';

/**
 * Assembles the song page. THE MAIN FLOW — start reading here.
 *
 *   1. load song, lines, selectable words, summary   (three fixed queries)
 *   2. decide servability per line and per summary   (domain/grounding)
 *   3. check every string at the output boundary     (domain/scriptValidator)
 *   4. derive coverage and the opening line          (domain/coverage)
 *
 * Steps 2 and 3 are where the constitution lives. Nothing here invents content:
 * a line either has a rendering backed by enough sources, or it says so.
 */

export class SongNotFound extends Error {}

/**
 * The output boundary (R-07).
 *
 * Runs even though the writer validates too, because the pipeline that writes
 * this data is out of scope for this feature and cannot be assumed to have run
 * a current validator. A failing entity is withheld and logged — one bad line
 * never fails the whole page, and the failure is never swallowed.
 */
function passesBoundary(text: string, mode: Mode, path: string): boolean {
  const result = validateScript(text, mode);
  if (result.ok) return true;
  log.error('script validation failed at output boundary', {
    path,
    mode,
    violations: result.violations.map((v) => v.kind),
  });
  return false;
}

function toMeaningView(
  meaningId: string,
  text: string,
  status: 'active' | 'stale',
  sourceCount: number,
): MeaningView {
  return { meaningId, text, sourceCount, status };
}

function toUngrounded(sourceCount: number, hasRendering: boolean): UngroundedView {
  const state = assessGrounding(sourceCount, hasRendering);
  return {
    // assessGrounding only returns null for `reason` when servable, and this is
    // only reached when it is not.
    reason: state.reason ?? 'no_material',
    sourceCount: state.sourceCount,
    sourcesRequired: state.sourcesRequired,
  };
}

function buildLine(
  row: LineRow,
  mode: Mode,
  words: SelectableWord[],
  needsBackfill: string[],
): LineView {
  const hasRendering = row.meaningText !== null && row.meaningId !== null;
  const state = assessGrounding(row.sourceCount, hasRendering);

  if (
    state.servable &&
    row.meaningId !== null &&
    row.meaningText !== null &&
    row.meaningStatus !== null &&
    passesBoundary(row.meaningText, mode, `lines[${row.lineNo}].meaning.text`)
  ) {
    return {
      lineNo: row.lineNo,
      text: row.text,
      words,
      meaning: toMeaningView(row.meaningId, row.meaningText, row.meaningStatus, row.sourceCount),
      ungrounded: null,
    };
  }

  const ungrounded = toUngrounded(row.sourceCount, hasRendering);

  // The meaning exists and is grounded; only this language is missing. Queue it
  // rather than blocking, and never fall back to another language — that would
  // have the reader believe English was all that existed (R-02).
  if (ungrounded.reason === 'mode_unavailable' && row.meaningId !== null) {
    needsBackfill.push(row.meaningId);
  }

  return { lineNo: row.lineNo, text: row.text, words, meaning: null, ungrounded };
}

function groupWords(rows: WordRow[], mode: Mode): Map<string, SelectableWord[]> {
  const byLine = new Map<string, SelectableWord[]>();
  for (const row of rows) {
    // A word is selectable only if its own meaning clears the bar (FR-020).
    if (!assessGrounding(row.sourceCount).servable) continue;
    if (!passesBoundary(row.text, mode, `word[${row.occurrenceId}]`)) continue;
    const list = byLine.get(row.lineId) ?? [];
    list.push({ occurrenceId: row.occurrenceId, position: row.position, text: row.text });
    byLine.set(row.lineId, list);
  }
  return byLine;
}

function buildViewer(viewer: Viewer): ViewerView | null {
  if (viewer.userId === null) return null;
  const e = getEntitlements(viewer);
  return {
    plan: e.plan,
    quota:
      e.showQuotaMeter && e.researchLimit !== null && e.researchRemaining !== null
        ? { remaining: e.researchRemaining, limit: e.researchLimit }
        : null,
    chatbotAvailable: e.chatbotAvailable,
  };
}

export async function getSongPage(
  slug: string,
  mode: Mode,
  viewer: Viewer,
): Promise<SongPageResponse> {
  const script = scriptForMode(mode);

  const song = await fetchSong(slug, script);
  if (song === null) throw new SongNotFound(slug);

  const [lineRows, wordRows, summaryRow] = await Promise.all([
    fetchLines(song.songId, script, mode),
    fetchSelectableWords(song.songId, script, mode),
    fetchSummary(song.songId, mode),
  ]);

  const wordsByLine = groupWords(wordRows, mode);
  const needsBackfill: string[] = [];
  const lines = lineRows.map((row) =>
    buildLine(row, mode, wordsByLine.get(row.lineId) ?? [], needsBackfill),
  );

  // A summary is shown only when the summary itself is grounded. One assembled
  // from a handful of line meanings would be a guess (FR-024).
  let summary: MeaningView | null = null;
  let summaryUngrounded: UngroundedView | null = null;
  if (summaryRow === null) {
    summaryUngrounded = { reason: 'no_material', sourceCount: 0, sourcesRequired: assessGrounding(0).sourcesRequired };
  } else {
    const hasRendering = summaryRow.text !== null;
    const state = assessGrounding(summaryRow.sourceCount, hasRendering);
    if (state.servable && summaryRow.text !== null && passesBoundary(summaryRow.text, mode, 'summary.text')) {
      summary = toMeaningView(summaryRow.meaningId, summaryRow.text, summaryRow.status, summaryRow.sourceCount);
    } else {
      summaryUngrounded = toUngrounded(summaryRow.sourceCount, hasRendering);
    }
  }

  // Fire and forget: enqueueBackfill swallows its own failures, because a queue
  // that is down must not fail a page the reader can otherwise read.
  for (const meaningId of needsBackfill) {
    void enqueueBackfill({ meaningId, targetMode: mode });
  }

  const servability = lines.map((l) => ({ lineNo: l.lineNo, servable: l.meaning !== null }));

  return {
    song: {
      slug: song.slug,
      title: song.title,
      artist: song.artist,
      year: song.year,
      film: song.film,
    },
    mode,
    lang: langAttrForMode(mode),
    coverage: computeCoverage(servability),
    activeLineNo: firstServableLineNo(servability),
    lines,
    summary,
    summaryUngrounded,
    viewer: buildViewer(viewer),
  };
}
