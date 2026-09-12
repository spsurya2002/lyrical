import pg from 'pg';

/**
 * Integration tests run against a REAL Postgres, on a database of their own.
 *
 * A fake would not reproduce the aggregate behaviour the grounding rule depends
 * on (R-08), and grounding is the rule the whole product rests on — so it is
 * exactly the thing that must not be tested against a mock.
 */

const ADMIN_URL =
  process.env['TEST_ADMIN_URL'] ?? 'postgres://lyricsense:lyricsense@localhost:5432/postgres';
const TEST_DB = 'lyricsense_test';

export const TEST_DATABASE_URL = `postgres://lyricsense:lyricsense@localhost:5432/${TEST_DB}`;

/** Creates the test database if it does not exist. Safe to call repeatedly. */
export async function ensureTestDatabase(): Promise<void> {
  const admin = new pg.Client({ connectionString: ADMIN_URL });
  await admin.connect();
  try {
    const { rows } = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [TEST_DB]);
    if (rows.length === 0) {
      await admin.query(`CREATE DATABASE ${TEST_DB}`);
    }
  } finally {
    await admin.end();
  }
}

/** True when a Postgres is reachable, so tests can skip rather than fail noisily. */
export async function postgresAvailable(): Promise<boolean> {
  const client = new pg.Client({ connectionString: ADMIN_URL, connectionTimeoutMillis: 2000 });
  try {
    await client.connect();
    await client.end();
    return true;
  } catch {
    return false;
  }
}
