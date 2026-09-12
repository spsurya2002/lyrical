import { Router } from 'express';
import { isMode } from '../../domain/modeScript.js';
import { getWordMeaning, WordMeaningNotFound } from '../../services/wordMeaningService.js';
import { HttpError } from '../middleware/errors.js';

/**
 * GET /api/songs/:slug/words/:occurrenceId?mode=en|hi|hi-Latn
 *
 * Word meanings load on selection rather than with the page (R-03): a long song
 * has hundreds of occurrences and a reader opens perhaps five.
 *
 * Consumes no quota.
 */
export const wordMeaningRouter = Router();

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

wordMeaningRouter.get('/songs/:slug/words/:occurrenceId', async (req, res, next) => {
  try {
    const occurrenceId = req.params.occurrenceId;
    if (!UUID.test(occurrenceId)) {
      throw new HttpError(400, 'invalid occurrence id', 'INVALID_ID');
    }

    const rawMode = req.query['mode'] ?? 'en';
    if (!isMode(rawMode)) {
      throw new HttpError(400, `unknown mode: ${String(rawMode)}`, 'INVALID_MODE');
    }

    res.json(await getWordMeaning(occurrenceId, rawMode));
  } catch (error) {
    if (error instanceof WordMeaningNotFound) {
      next(new HttpError(404, 'no meaning for that word here', 'NOT_FOUND'));
      return;
    }
    next(error);
  }
});
