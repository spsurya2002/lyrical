import { startBackfillWorker } from './queue.js';
import { config } from '../config/index.js';

/**
 * The background worker process. Run with `npm run worker`.
 *
 * Separate from the API so a slow model call cannot occupy a request handler,
 * and so the two can be scaled independently.
 */
const worker = startBackfillWorker();

console.log(
  `worker started — queue: rendering-backfill, provider: ${config.LLM_PROVIDER}, ` +
    `limit: ${config.RATE_LIMIT_MODEL_PER_MINUTE}/min`,
);

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    void worker.close().then(() => process.exit(0));
  });
}
