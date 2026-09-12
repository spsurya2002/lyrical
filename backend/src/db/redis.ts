import { Redis } from 'ioredis';
import { config } from '../config/index.js';

/**
 * Shared Redis connection. Does double duty as cache and, later, as the BullMQ
 * queue backend (tech_stack.md).
 */
export const redis = new Redis(config.REDIS_URL, {
  maxRetriesPerRequest: null, // required by BullMQ
  lazyConnect: true,
});

export async function closeRedis(): Promise<void> {
  await redis.quit();
}
