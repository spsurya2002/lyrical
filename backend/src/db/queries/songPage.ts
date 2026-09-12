import { pool } from '../pool.js';
import type { Mode, Script } from '../../domain/modeScript.js';

/**
 * Assembling a song page takes a FIXED THREE queries, never one per line.
 *
 *   1. song + lines + line text + line meanings + renderings + source counts
 *   2. word occurrences that have a meaning (which words are selectable)
 *   3. the song summary meaning
 *
 * The plan (research.md R-03) anticipated two; the third is for word
 * selectability, which the page needs even though word MEANINGS load lazily.
 * Three fixed queries still satisfies the constraint that mattered — no N+1.
 *
 * Source counts come back as an aggregate so servability is derived per read
 * (R-05) without a second round trip.
 */

export interface SongRow {
  songId: string;
  slug: string;
  title: string;
  artist: string;
  year: number | null;
  film: string | null;
}

export interface LineRow {
  lineId: string;
  lineNo: number;
  text: string;
  meaningId: string | null;
  meaningText: string | null;
  meaningStatus: 'active' | 'stale' | null;
  sourceCount: number;
}

export interface WordRow {
  occurrenceId: string;
  lineId: string;
  position: number;
  text: string;
  sourceCount: number;
}

export interface SummaryRow {
  meaningId: string;
  text: string | null;
  status: 'active' | 'stale';
  sourceCount: number;
}

/**
 * Picks ONE meaning per target: the active one, or the stale one when no active
 * replacement exists yet. A stale meaning stays readable while it is regenerated
 * (FR-007) — hiding it would punish the reader for a background job.
 */
const MEANING_LATERAL = `
  LEFT JOIN LATERAL (
    SELECT m.id, m.status
    FROM meaning m
    WHERE m.target_type = $TARGET_TYPE AND m.target_id = $TARGET_ID
    ORDER BY (m.status = 'active') DESC, m.created_at DESC
    LIMIT 1
  ) m ON true
`;

export async function fetchSong(slug: string, script: Script): Promise<SongRow | null> {
  const { rows } = await pool.query<SongRow>(
    `SELECT s.id AS "songId", s.slug, st.text AS title, s.artist, s.year, s.film
     FROM song s
     JOIN song_title st ON st.song_id = s.id AND st.script = $2
     WHERE s.slug = $1`,
    [slug, script],
  );
  return rows[0] ?? null;
}

export async function fetchLines(
  songId: string,
  script: Script,
  mode: Mode,
): Promise<LineRow[]> {
  const sql = `
    SELECT
      l.id        AS "lineId",
      l.line_no   AS "lineNo",
      llt.text    AS text,
      m.id        AS "meaningId",
      mr.text     AS "meaningText",
      m.status    AS "meaningStatus",
      COALESCE(sc.n, 0)::int AS "sourceCount"
    FROM lyric_line l
    JOIN lyric_line_text llt ON llt.line_id = l.id AND llt.script = $2
    ${MEANING_LATERAL.replace('$TARGET_TYPE', `'line'`).replace('$TARGET_ID', 'l.id')}
    LEFT JOIN meaning_rendering mr ON mr.meaning_id = m.id AND mr.mode = $3
    LEFT JOIN (
      SELECT meaning_id, count(*) AS n FROM meaning_source GROUP BY meaning_id
    ) sc ON sc.meaning_id = m.id
    WHERE l.song_id = $1
    ORDER BY l.line_no
  `;
  const { rows } = await pool.query<LineRow>(sql, [songId, script, mode]);
  return rows;
}

export async function fetchSelectableWords(
  songId: string,
  script: Script,
  mode: Mode,
): Promise<WordRow[]> {
  // The script selects a COLUMN, not a value, so it is chosen here rather than
  // bound as a parameter. `script` is a union of two literals, never user input.
  const surface = script === 'deva' ? 'w.surface_deva' : 'w.surface_latn';
  const sql = `
    SELECT
      w.id       AS "occurrenceId",
      w.line_id  AS "lineId",
      w.position AS position,
      ${surface} AS text,
      COALESCE(sc.n, 0)::int AS "sourceCount"
    FROM word_occurrence w
    JOIN lyric_line l ON l.id = w.line_id
    ${MEANING_LATERAL.replace('$TARGET_TYPE', `'word_occurrence'`).replace('$TARGET_ID', 'w.id')}
    JOIN meaning_rendering mr ON mr.meaning_id = m.id AND mr.mode = $2
    LEFT JOIN (
      SELECT meaning_id, count(*) AS n FROM meaning_source GROUP BY meaning_id
    ) sc ON sc.meaning_id = m.id
    WHERE l.song_id = $1
    ORDER BY w.line_id, w.position
  `;
  const { rows } = await pool.query<WordRow>(sql, [songId, mode]);
  return rows;
}

export async function fetchSummary(songId: string, mode: Mode): Promise<SummaryRow | null> {
  const sql = `
    SELECT
      m.id     AS "meaningId",
      mr.text  AS text,
      m.status AS status,
      COALESCE(sc.n, 0)::int AS "sourceCount"
    FROM (SELECT $1::uuid AS id) s
    ${MEANING_LATERAL.replace('$TARGET_TYPE', `'song_summary'`).replace('$TARGET_ID', 's.id')}
    LEFT JOIN meaning_rendering mr ON mr.meaning_id = m.id AND mr.mode = $2
    LEFT JOIN (
      SELECT meaning_id, count(*) AS n FROM meaning_source GROUP BY meaning_id
    ) sc ON sc.meaning_id = m.id
    WHERE m.id IS NOT NULL
  `;
  const { rows } = await pool.query<SummaryRow>(sql, [songId, mode]);
  return rows[0] ?? null;
}
