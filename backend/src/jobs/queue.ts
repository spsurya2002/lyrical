import { Queue, Worker } from 'bullmq';
import type { ConnectionOptions } from 'bullmq';
import { config } from '../config/index.js';
import { log } from '../api/middleware/errors.js';
import { backfillRendering, type BackfillJob } from './backfillRendering.js';

/**
 * Background jobs. Redis-backed (tech_stack.md), so work is not duplicated when
 * several instances see the same gap, and a scheduled task does not fire once
 * per API instance.
 */

export const BACKFILL_QUEUE = 'rendering-backfill';

const connection: ConnectionOptions = { url: config.REDIS_URL };

let queue: Queue<BackfillJob> | null = null;

export function backfillQueue(): Queue<BackfillJob> {
  queue ??= new Queue<BackfillJob>(BACKFILL_QUEUE, { connection });
  return queue;
}

/**
 * Enqueues a missing rendering.
 *
 * The job id is the meaning and mode, so BullMQ deduplicates: a popular song
 * whose Hindi rendering is missing will be requested by every reader who opens
 * it, and that must produce one job, not one per reader. This is the difference
 * between a cost that scales with catalogue and one that scales with traffic.
 *
 * The separator is `__`, not `:` — BullMQ reserves the colon as its Redis key
 * separator and rejects custom ids containing one. With a colon here every
 * enqueue failed, and because the failure is caught below it failed silently:
 * pages kept working and renderings were never backfilled.
 */
export function backfillJobId(job: BackfillJob): string {
  return `${job.meaningId}__${job.targetMode}`;
}

export async function enqueueBackfill(job: BackfillJob): Promise<void> {
  try {
    await backfillQueue().add(BACKFILL_QUEUE, job, {
      jobId: backfillJobId(job),
      removeOnComplete: 100,
      removeOnFail: 500,
      attempts: 3,
      backoff: { type: 'exponential', delay: 5_000 },
    });
  } catch (error) {
    // A failed enqueue must not fail the page. The reader sees the honest
    // "not available in this language yet" state either way.
    log.warn('could not enqueue backfill', {
      meaningId: job.meaningId,
      targetMode: job.targetMode,
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

export function startBackfillWorker(): Worker<BackfillJob> {
  const worker = new Worker<BackfillJob>(
    BACKFILL_QUEUE,
    async (job) => backfillRendering(job.data),
    {
      connection,
      // Principle VI: the model-calling path is rate limited. This is the
      // worker-side ceiling; the HTTP limiter guards request paths.
      limiter: { max: config.RATE_LIMIT_MODEL_PER_MINUTE, duration: 60_000 },
      concurrency: 2,
    },
  );

  worker.on('failed', (job, error) => {
    log.error('backfill job failed', {
      jobId: job?.id,
      attempts: job?.attemptsMade,
      message: error.message,
    });
  });

  return worker;
}
