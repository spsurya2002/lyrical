import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../../db/pool.js';
import { HttpError, log } from '../middleware/errors.js';

/**
 * POST /api/songs/:slug/notify
 *
 * Records a request to be told when a song becomes explained (FR-038).
 *
 * ⚠️ SENDING IS NOT IMPLEMENTED. This stores the request; nothing delivers it
 * yet. The UI copy must say "we'll record that" rather than "we'll email you",
 * because promising a message that cannot arrive is its own kind of invention.
 *
 * Consumes no quota, and is free on both plans — the same reasoning as
 * contribution: this is how the product learns what to research next, and
 * charging for it would starve the thing that makes it work.
 */
export const notifyMeRouter = Router();

const body = z.object({
  email: z.string().email().max(320),
});

notifyMeRouter.post('/songs/:slug/notify', async (req, res, next) => {
  try {
    const parsed = body.safeParse(req.body);
    if (!parsed.success) {
      throw new HttpError(400, 'a valid email address is required', 'INVALID_EMAIL');
    }

    const { rows } = await pool.query<{ id: string }>(
      `SELECT id FROM song WHERE slug = $1`,
      [req.params.slug],
    );
    const songId = rows[0]?.id;
    if (songId === undefined) {
      throw new HttpError(404, 'song not found', 'SONG_NOT_FOUND');
    }

    // Asking twice is not two requests. ON CONFLICT keeps this idempotent so a
    // frustrated reader clicking repeatedly does not queue duplicate emails.
    await pool.query(
      `INSERT INTO notify_request (song_id, email)
       VALUES ($1, $2)
       ON CONFLICT (song_id, lower(email)) DO NOTHING`,
      [songId, parsed.data.email],
    );

    log.info('notify request recorded', { slug: req.params.slug });
    res.status(202).json({ recorded: true });
  } catch (error) {
    next(error);
  }
});
