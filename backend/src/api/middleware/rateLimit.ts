import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { config } from '../../config/index.js';
import { redis } from '../../db/redis.js';

/**
 * Rate limiting. Constitution Principle VI.
 *
 * Read routes are limited generously — they are cheap, but an unbounded scraper
 * still costs bandwidth and database time.
 *
 * The model-calling limiter exists for the rendering-backfill path. A
 * model-calling route without a rate limit is an unfinished feature, not a
 * working one — no exceptions, including internal and admin routes.
 *
 * Redis-backed so the limit holds across instances. An in-memory limiter
 * multiplies the real limit by the number of instances running.
 */

function store(prefix: string): RedisStore {
  return new RedisStore({
    prefix,
    sendCommand: (...args: string[]) => redis.call(...(args as [string, ...string[]])) as never,
  });
}

/**
 * Contract tests mount the app without Redis. The limiter is still ATTACHED to
 * every route it guards — only its counting is skipped — so a route that forgot
 * its limiter is still a route with no limiter, and a test can prove it.
 */
const skipInTests = (): boolean => config.NODE_ENV === 'test';

export const readLimiter = rateLimit({
  windowMs: 60_000,
  limit: config.RATE_LIMIT_READ_PER_MINUTE,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  store: store('rl:read:'),
  skip: skipInTests,
  message: { error: 'too many requests' },
});

export const modelLimiter = rateLimit({
  windowMs: 60_000,
  limit: config.RATE_LIMIT_MODEL_PER_MINUTE,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  store: store('rl:model:'),
  skip: skipInTests,
  message: { error: 'too many requests' },
});
