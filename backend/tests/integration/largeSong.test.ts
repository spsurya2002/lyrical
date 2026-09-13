import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import { ensureTestDatabase, postgresAvailable, TEST_DATABASE_URL } from '../helpers/db.js';

/**
 * A long song — 200 lines, 40 explained. T086, SC-008.
 *
 * Qawwalis genuinely run this long, so this is the catalogue's real upper end
 * rather than a synthetic stress case.
 *
 * It also settles research.md R-03, which projected that the page would need
 * WINDOWED loading above 150 lines. That was a guess made before any
 * measurement. These tests record what the payload and timing actually are, so
 * the decision to build windowing — or not — rests on numbers.
 */

const available = await postgresAvailable();
if (available) {
  await ensureTestDatabase();
  process.env['DATABASE_URL'] = TEST_DATABASE_URL;
}

const { createApp } = await import('../../src/app.js');
const { migrate } = await import('../../src/db/migrate.js');
const { seed } = await import('../../src/db/seed/index.js');

const app = createApp();

describe.skipIf(!available)('a 200-line song', () => {
  beforeAll(async () => {
    await migrate();
    await seed();
  }, 120_000);

  it('serves every line in one request', async () => {
    const res = await request(app).get('/api/songs/allah-hoo?mode=en');
    expect(res.status).toBe(200);
    expect(res.body.lines).toHaveLength(200);
    expect(res.body.coverage.linesExplained).toBe(40);
  });

  it('stays within a payload budget a phone can afford', async () => {
    const res = await request(app).get('/api/songs/allah-hoo?mode=en');
    const bytes = Buffer.byteLength(JSON.stringify(res.body), 'utf8');

    // R-03 estimated 60-80 KB for a 100-line song and judged that acceptable.
    // 200 lines with 40 meanings should stay comfortably under 250 KB
    // uncompressed, which gzips to a fraction of that.
    expect(bytes).toBeLessThan(250_000);
    console.log(`    payload: ${(bytes / 1024).toFixed(1)} KB for 200 lines`);
  });

  it('is not slower per line than a short song', async () => {
    // The real risk R-03 worried about was an N+1 hiding in the query. If the
    // page is assembled in a fixed number of queries, a song eight times longer
    // costs far less than eight times as much.
    const shortStart = performance.now();
    await request(app).get('/api/songs/arziyan?mode=en');
    const shortMs = performance.now() - shortStart;

    const longStart = performance.now();
    await request(app).get('/api/songs/allah-hoo?mode=en');
    const longMs = performance.now() - longStart;

    console.log(
      `    26 lines: ${shortMs.toFixed(0)}ms · 200 lines: ${longMs.toFixed(0)}ms ` +
        `(${(longMs / shortMs).toFixed(1)}x for ${(200 / 26).toFixed(1)}x the lines)`,
    );

    // Well under linear. If this ever fails, an N+1 has crept in.
    expect(longMs).toBeLessThan(shortMs * 8);
  });

  it('serves it in every mode without the payload changing shape', async () => {
    for (const mode of ['en', 'hi', 'hi-Latn']) {
      const res = await request(app).get(`/api/songs/allah-hoo?mode=${mode}`);
      expect(res.body.lines).toHaveLength(200);
      expect(res.body.coverage.linesExplained).toBe(40);
    }
  });

  it('opens on a grounded line near the top, not the end', async () => {
    const res = await request(app).get('/api/songs/allah-hoo?mode=en');
    expect(res.body.activeLineNo).toBe(1);
  });
});
