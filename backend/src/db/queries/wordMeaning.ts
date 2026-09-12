import { pool } from '../pool.js';
import type { Mode, Script } from '../../domain/modeScript.js';

/**
 * Word meanings, looked up by OCCURRENCE — never by spelling.
 *
 * This is the spec's hardest idea (FR-018). The same word can mean different
 * things in two songs, and twice within one song. A query keyed on the surface
 * form would collapse those into one answer and quietly serve the wrong meaning
 * for one of them.
 */

export interface WordMeaningRow {
  occurrenceId: string;
  surface: string;
  lineNo: number;
  songSlug: string;
  meaningId: string | null;
  meaningText: string | null;
  sourceCount: number;
}

export interface SiblingOccurrenceRow {
  occurrenceId: string;
  lineNo: number;
  meaningId: string | null;
  sourceCount: number;
}

const ACTIVE_MEANING = `
  LEFT JOIN LATERAL (
    SELECT m.id, m.status
    FROM meaning m
    WHERE m.target_type = 'word_occurrence' AND m.target_id = w.id
    ORDER BY (m.status = 'active') DESC, m.created_at DESC
    LIMIT 1
  ) m ON true
`;

const SOURCE_COUNTS = `
  LEFT JOIN (
    SELECT meaning_id, count(*) AS n FROM meaning_source GROUP BY meaning_id
  ) sc ON sc.meaning_id = m.id
`;

export async function fetchWordMeaning(
  occurrenceId: string,
  script: Script,
  mode: Mode,
): Promise<WordMeaningRow | null> {
  const surface = script === 'deva' ? 'w.surface_deva' : 'w.surface_latn';
  const { rows } = await pool.query<WordMeaningRow>(
    `SELECT
       w.id        AS "occurrenceId",
       ${surface}  AS surface,
       l.line_no   AS "lineNo",
       s.slug      AS "songSlug",
       m.id        AS "meaningId",
       mr.text     AS "meaningText",
       COALESCE(sc.n, 0)::int AS "sourceCount"
     FROM word_occurrence w
     JOIN lyric_line l ON l.id = w.line_id
     JOIN song s ON s.id = l.song_id
     ${ACTIVE_MEANING}
     LEFT JOIN meaning_rendering mr ON mr.meaning_id = m.id AND mr.mode = $2
     ${SOURCE_COUNTS}
     WHERE w.id = $1`,
    [occurrenceId, mode],
  );
  return rows[0] ?? null;
}

/**
 * The other occurrences of the same spelling in the same song.
 *
 * Scoped to the song deliberately: `ishq` in another song is a different word
 * as far as this product is concerned, and listing it would suggest a
 * connection the sources do not support.
 */
export async function fetchSiblingOccurrences(
  occurrenceId: string,
  script: Script,
): Promise<SiblingOccurrenceRow[]> {
  const surface = script === 'deva' ? 'surface_deva' : 'surface_latn';
  const { rows } = await pool.query<SiblingOccurrenceRow>(
    `WITH target AS (
       SELECT w.id, w.${surface} AS surface, l.song_id
       FROM word_occurrence w
       JOIN lyric_line l ON l.id = w.line_id
       WHERE w.id = $1
     )
     SELECT
       w.id      AS "occurrenceId",
       l.line_no AS "lineNo",
       m.id      AS "meaningId",
       COALESCE(sc.n, 0)::int AS "sourceCount"
     FROM word_occurrence w
     JOIN lyric_line l ON l.id = w.line_id
     JOIN target t ON t.song_id = l.song_id
       AND lower(w.${surface}) = lower(t.surface)
       AND w.id <> t.id
     ${ACTIVE_MEANING}
     ${SOURCE_COUNTS}
     ORDER BY l.line_no`,
    [occurrenceId],
  );
  return rows;
}
