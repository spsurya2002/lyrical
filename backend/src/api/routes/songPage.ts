import { Router } from 'express';
import { HttpError } from '../middleware/errors.js';
import { isMode, type Mode } from '../../domain/modeScript.js';
import { getSongPage, SongNotFound } from '../../services/songPageService.js';

/**
 * GET /api/songs/:slug?mode=en|hi|hi-Latn
 *
 * Thin by design: parse, delegate, respond. Every rule lives in domain/ and the
 * assembly lives in the service, so this file stays readable as a list of
 * endpoints rather than a place logic accumulates.
 *
 * Consumes no quota. Ever. (FR-028.)
 */
export const songPageRouter = Router();

songPageRouter.get('/songs/:slug', async (req, res, next) => {
  try {
    const slug = req.params.slug;
    const raw = req.query['mode'] ?? 'en';
    if (!isMode(raw)) {
      throw new HttpError(400, `unknown mode: ${String(raw)}`, 'INVALID_MODE');
    }
    const mode: Mode = raw;

    const page = await getSongPage(slug, mode, req.viewer);
    res.json(page);
  } catch (error) {
    if (error instanceof SongNotFound) {
      next(new HttpError(404, 'song not found', 'SONG_NOT_FOUND'));
      return;
    }
    next(error);
  }
});
