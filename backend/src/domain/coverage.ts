/**
 * How much of a song is explained. FR-026, research.md R-06.
 *
 * Derived from the same assessment as grounding, in the same pass, so the
 * coverage figure and what the page actually shows can never disagree.
 *
 * Exists because per-line honesty (D-001) means the normal case is a song where
 * a few famous lines are well sourced and the rest are not. Without this, a song
 * with 4 of 26 lines explained looks complete.
 */

export interface Coverage {
  readonly linesExplained: number;
  readonly linesTotal: number;
  /** 0–1. `0` when the song has no lines, rather than NaN. */
  readonly ratio: number;
}

export function computeCoverage(
  lines: ReadonlyArray<{ readonly servable: boolean }>,
): Coverage {
  const linesTotal = lines.length;
  const linesExplained = lines.reduce((n, line) => n + (line.servable ? 1 : 0), 0);
  return {
    linesExplained,
    linesTotal,
    ratio: linesTotal === 0 ? 0 : linesExplained / linesTotal,
  };
}

/**
 * The line the page opens on: the first SERVABLE line, not line 1.
 *
 * On a partly grounded song these differ, and landing a user on an empty panel
 * when four lines are explained wastes the only thing the page has to offer.
 *
 * Returns null when nothing is servable — the caller shows the song-level
 * ungrounded state instead.
 */
export function firstServableLineNo(
  lines: ReadonlyArray<{ readonly lineNo: number; readonly servable: boolean }>,
): number | null {
  return lines.find((line) => line.servable)?.lineNo ?? null;
}
