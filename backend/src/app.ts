import express from 'express';
import type { Express } from 'express';
import { errorHandler, notFound } from './api/middleware/errors.js';
import { optionalAuth } from './api/middleware/optionalAuth.js';
import { readLimiter } from './api/middleware/rateLimit.js';
import { songPageRouter } from './api/routes/songPage.js';
import { sourcesRouter } from './api/routes/sources.js';
import { wordMeaningRouter } from './api/routes/wordMeaning.js';

/**
 * Builds the Express app without starting it, so tests can mount it directly
 * (Supertest) rather than binding a port.
 *
 * Middleware order matters: auth resolves the viewer before any route reads it,
 * and the error handler is last because Express identifies it by arity and only
 * reaches it after everything mounted above.
 *
 * Routes are added in their own phases — see specs/001-song-page-trilingual/tasks.md.
 */
export function createApp(): Express {
  const app = express();

  app.use(express.json({ limit: '1mb' }));
  app.disable('x-powered-by');
  // Render and Railway sit behind a proxy; without this every client looks like
  // the same IP and the rate limiter becomes a global limit.
  app.set('trust proxy', 1);

  // Optional, never required: signed-out visitors read song pages (R-09).
  app.use(optionalAuth);

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api', readLimiter);
  app.use('/api', songPageRouter);
  app.use('/api', wordMeaningRouter);
  app.use('/api', sourcesRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
