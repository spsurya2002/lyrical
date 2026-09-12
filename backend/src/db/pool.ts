import pg from 'pg';
import { config } from '../config/index.js';

/**
 * The single connection pool. Plain SQL underneath, no ORM — tech_stack.md
 * keeps the schema portable between Postgres providers.
 */
export const pool = new pg.Pool({
  connectionString: config.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
});

export async function closePool(): Promise<void> {
  await pool.end();
}
