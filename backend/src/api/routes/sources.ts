import { Router } from 'express';
import { fetchSourcesForMeaning } from '../../db/queries/sources.js';
import { isMode } from '../../domain/modeScript.js';
import { HttpError } from '../middleware/errors.js';

/**
 * GET /api/meanings/:meaningId/sources
 *
 * Opened from the source strip. Returns the excerpt actually used to build the
 * explanation, stored at retrieval time so a source that later goes offline can
 * still be shown and attributed.
 */
export const sourcesRouter = Router();

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

sourcesRouter.get('/meanings/:meaningId/sources', async (req, res, next) => {
  try {
    const meaningId = req.params.meaningId;
    if (!UUID.test(meaningId)) {
      throw new HttpError(400, 'invalid meaning id', 'INVALID_ID');
    }

    // The source strip is rendered inside a page that has a mode, and an
    // excerpt must be checked against that mode before it is returned.
    const rawMode = req.query['mode'] ?? 'en';
    if (!isMode(rawMode)) {
      throw new HttpError(400, `unknown mode: ${String(rawMode)}`, 'INVALID_MODE');
    }

    const sources = await fetchSourcesForMeaning(meaningId, rawMode);
    if (sources.length === 0) {
      // No rows means either no such meaning, or a meaning with no sources —
      // which is not a servable meaning in the first place. Both are 404 to a
      // client: there is nothing here to show.
      throw new HttpError(404, 'no sources for that meaning', 'NOT_FOUND');
    }

    res.json({ sources });
  } catch (error) {
    next(error);
  }
});
