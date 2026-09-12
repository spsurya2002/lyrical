import { Redis } from 'ioredis';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

/**
 * The backfill queue actually accepts jobs.
 *
 * This test exists because it did not. The job id used a colon, BullMQ rejects
 * that, and `enqueueBackfill` catches its own failures so the page kept working
 * while no rendering was ever queued. A silent no-op is the worst kind of bug —
 * nothing looks wrong, and the feature simply never happens.
 *
 * So: assert the job lands, not merely that enqueueing did not throw.
 */

const REDIS_URL = 'redis://localhost:6379';

async function redisAvailable(): Promise<boolean> {
  const client = new Redis(REDIS_URL, { lazyConnect: true, connectTimeout: 2000, retryStrategy: () => null });
  try {
    await client.connect();
    await client.quit();
    return true;
  } catch {
    return false;
  }
}

const available = await redisAvailable();
if (available) process.env['REDIS_URL'] = REDIS_URL;

const { backfillQueue, backfillJobId, enqueueBackfill } = await import('../../src/jobs/queue.js');

describe.skipIf(!available)('backfill queue', () => {
  const meaningId = '00000000-0000-4000-8000-00000000ffff';

  beforeAll(async () => {
    await backfillQueue().obliterate({ force: true });
  });

  afterAll(async () => {
    await backfillQueue().obliterate({ force: true });
    await backfillQueue().close();
  });

  it('accepts a job id that BullMQ will not reject', () => {
    // The colon is BullMQ's Redis key separator and is refused outright.
    expect(backfillJobId({ meaningId, targetMode: 'hi' })).not.toContain(':');
  });

  it('actually puts the job on the queue', async () => {
    await enqueueBackfill({ meaningId, targetMode: 'hi' });
    const counts = await backfillQueue().getJobCounts('wait', 'delayed', 'active');
    expect((counts['wait'] ?? 0) + (counts['delayed'] ?? 0) + (counts['active'] ?? 0)).toBe(1);
  });

  it('deduplicates repeat requests for the same rendering', async () => {
    // A popular song missing its Hindi rendering is requested by every reader
    // who opens it. That must produce one job, not one per reader — the
    // difference between cost scaling with catalogue and with traffic.
    for (let i = 0; i < 5; i += 1) {
      await enqueueBackfill({ meaningId, targetMode: 'hi' });
    }
    const counts = await backfillQueue().getJobCounts('wait', 'delayed', 'active');
    expect((counts['wait'] ?? 0) + (counts['delayed'] ?? 0) + (counts['active'] ?? 0)).toBe(1);
  });

  it('treats a different mode as a different job', async () => {
    await enqueueBackfill({ meaningId, targetMode: 'hi-Latn' });
    const counts = await backfillQueue().getJobCounts('wait', 'delayed', 'active');
    expect((counts['wait'] ?? 0) + (counts['delayed'] ?? 0) + (counts['active'] ?? 0)).toBe(2);
  });
});
