import { pool } from '../pool.js';
import type { SourceView } from '../../api/types.js';
import type { Mode } from '../../domain/modeScript.js';
import { isScriptValid } from '../../domain/scriptValidator.js';

interface SourceRow {
  domain: string;
  url: string;
  type: string;
  excerpt: string;
  retrievedAt: string;
  reachable: boolean;
}

/**
 * The sources behind one explanation (FR-004).
 *
 * Two rules that look small and are not:
 *
 * 1. Unreachable sources are RETURNED, marked. A rotted link does not unground
 *    an explanation, and hiding it would make the visible source list disagree
 *    with the count the meaning actually rests on.
 *
 * 2. An excerpt that cannot be rendered in this mode is WITHHELD, not dropped.
 *    These are qawwali and ghazal sources: Urdu-script excerpts are the normal
 *    case, not an anomaly. Dropping the source would silently lower the visible
 *    grounding; rendering it would violate Principle III. So the source stays,
 *    attributed, with its text withheld.
 */
export async function fetchSourcesForMeaning(
  meaningId: string,
  mode: Mode,
): Promise<SourceView[]> {
  const { rows } = await pool.query<SourceRow>(
    `SELECT s.domain, s.url, s.type::text AS type, s.excerpt,
            s.retrieved_at AS "retrievedAt", s.reachable
     FROM meaning_source ms
     JOIN source s ON s.id = ms.source_id
     WHERE ms.meaning_id = $1
     ORDER BY s.reachable DESC, s.domain`,
    [meaningId],
  );

  return rows.map((row) => {
    const renderable = isScriptValid(row.excerpt, mode);
    return {
      domain: row.domain,
      url: row.url,
      type: row.type,
      excerpt: renderable ? row.excerpt : null,
      excerptWithheld: !renderable,
      retrievedAt: row.retrievedAt,
      reachable: row.reachable,
    };
  });
}
