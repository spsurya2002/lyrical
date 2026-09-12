import { log } from '../api/middleware/errors.js';
import { pool } from '../db/pool.js';
import { MODES, type Mode } from '../domain/modeScript.js';
import { validateScript } from '../domain/scriptValidator.js';
import { providerFor } from '../llm/index.js';
import { buildRenderingPrompt, RENDERING_SYSTEM_PROMPT } from '../services/renderingPrompt.js';

/**
 * Produces a missing language rendering from a stored meaning (research.md R-02).
 *
 * A background job, never a request path: FR-014 forbids a loading state on a
 * mode change, and an inline model call cannot satisfy that. The page serves
 * what it has, marks what it lacks, and enqueues this.
 *
 * This is the ONLY model-calling path in this feature. It is rate limited, and
 * nothing it produces is stored until it passes the script validator.
 */

export interface BackfillJob {
  readonly meaningId: string;
  readonly targetMode: Mode;
}

/** Picks a rendering to translate from — any existing one will do, English first. */
async function findSourceRendering(
  meaningId: string,
): Promise<{ mode: Mode; text: string } | null> {
  const { rows } = await pool.query<{ mode: Mode; text: string }>(
    `SELECT mode, text FROM meaning_rendering
     WHERE meaning_id = $1
     ORDER BY (mode = 'en') DESC
     LIMIT 1`,
    [meaningId],
  );
  return rows[0] ?? null;
}

export async function backfillRendering(job: BackfillJob): Promise<'written' | 'skipped'> {
  const { meaningId, targetMode } = job;

  const existing = await pool.query(
    `SELECT 1 FROM meaning_rendering WHERE meaning_id = $1 AND mode = $2`,
    [meaningId, targetMode],
  );
  if (existing.rowCount !== null && existing.rowCount > 0) {
    // Another worker got there first. Not an error.
    return 'skipped';
  }

  const source = await findSourceRendering(meaningId);
  if (source === null) {
    // A meaning with no rendering at all is not this job's problem to invent —
    // it means the research pipeline never finished, and making one up here
    // would produce an explanation with no grounding behind it.
    log.warn('backfill skipped: meaning has no rendering to translate from', { meaningId });
    return 'skipped';
  }

  const provider = providerFor('rendering');
  const result = await provider.complete({
    system: RENDERING_SYSTEM_PROMPT,
    prompt: buildRenderingPrompt(source.text, source.mode, targetMode),
    temperature: 0.2,
  });

  const text = result.text.trim();

  // The gate. Nothing reaches storage without passing it — a bad rendering
  // written to the cache outlives the bug that produced it.
  const validation = validateScript(text, targetMode);
  if (!validation.ok) {
    log.error('backfill rejected: rendering failed script validation', {
      meaningId,
      targetMode,
      provider: provider.name,
      model: result.model,
      violations: validation.violations.map((v) => v.kind),
    });
    throw new Error(
      `rendering for ${meaningId} in ${targetMode} failed script validation ` +
        `(${validation.violations.map((v) => v.kind).join(', ')})`,
    );
  }

  await pool.query(
    `INSERT INTO meaning_rendering (meaning_id, mode, text, validated_at)
     VALUES ($1, $2, $3, now())
     ON CONFLICT (meaning_id, mode) DO NOTHING`,
    [meaningId, targetMode, text],
  );

  log.info('backfilled rendering', { meaningId, targetMode, provider: provider.name });
  return 'written';
}

/** Finds meanings missing a rendering, so the queue can be filled. */
export async function findMissingRenderings(limit = 100): Promise<BackfillJob[]> {
  const { rows } = await pool.query<{ meaningId: string; mode: Mode }>(
    `SELECT m.id AS "meaningId", t.mode
     FROM meaning m
     CROSS JOIN unnest($1::mode[]) AS t(mode)
     WHERE NOT EXISTS (
       SELECT 1 FROM meaning_rendering mr
       WHERE mr.meaning_id = m.id AND mr.mode = t.mode
     )
     AND EXISTS (SELECT 1 FROM meaning_rendering mr2 WHERE mr2.meaning_id = m.id)
     LIMIT $2`,
    [[...MODES], limit],
  );
  return rows.map((r) => ({ meaningId: r.meaningId, targetMode: r.mode }));
}
