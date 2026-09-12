import express from 'express';
import type { Express } from 'express';

/**
 * Builds the Express app without starting it, so tests can mount it directly
 * (Supertest) rather than binding a port.
 *
 * Routes are added in their own phases — see specs/001-song-page-trilingual/tasks.md.
 */
export function createApp(): Express {
  const app = express();

  app.use(express.json({ limit: '1mb' }));
  app.disable('x-powered-by');

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  return app;
}
