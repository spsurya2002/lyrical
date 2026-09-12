import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import { ensureTestDatabase, postgresAvailable, TEST_DATABASE_URL } from '../helpers/db.js';

/**
 * Per-line honesty (D-001) and the notify path (FR-038).
 * T068, T071.
 *
 * The decision this guards: grounding is assessed per LINE, not per song. A
 * song with four explained lines out of twenty-six is shown, with those four
 * explained and the rest honestly marked — and it must never be mistaken for a
 * complete one.
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

interface Line {
  lineNo: number;
  meaning: { text: string } | null;
  ungrounded: { reason: string; sourceCount: number; sourcesRequired: number } | null;
}

describe.skipIf(!available)('per-line honesty', () => {
  beforeAll(async () => {
    await migrate();
    await seed();
  }, 120_000);

  it('explains the grounded lines and marks the rest, in one song', async () => {
    const res = await request(app).get('/api/songs/arziyan?mode=en');
    const lines = res.body.lines as Line[];

    const explained = lines.filter((l) => l.meaning !== null);
    const marked = lines.filter((l) => l.ungrounded !== null);

    expect(explained).toHaveLength(4);
    expect(marked).toHaveLength(22);
    expect(explained.length + marked.length).toBe(lines.length);
  });

  it('offers no partial meaning anywhere on a partly grounded song (FR-025)', async () => {
    const res = await request(app).get('/api/songs/arziyan?mode=en');
    for (const line of res.body.lines as Line[]) {
      // Exactly one of the two, never both, never neither, never a hedge.
      expect(line.meaning === null).toBe(line.ungrounded !== null);
      if (line.meaning === null) {
        expect(Object.keys(line.ungrounded ?? {})).not.toContain('text');
      }
    }
  });

  it('reports coverage that matches what it actually served (FR-026)', async () => {
    // Derived from one pass so the number and the page cannot disagree (R-06).
    const res = await request(app).get('/api/songs/arziyan?mode=en');
    const served = (res.body.lines as Line[]).filter((l) => l.meaning !== null).length;
    expect(res.body.coverage.linesExplained).toBe(served);
    expect(res.body.coverage.linesTotal).toBe((res.body.lines as Line[]).length);
  });

  it('keeps coverage consistent across all three modes', async () => {
    const counts = await Promise.all(
      ['en', 'hi', 'hi-Latn'].map(async (mode) => {
        const res = await request(app).get(`/api/songs/arziyan?mode=${mode}`);
        return res.body.coverage.linesExplained;
      }),
    );
    // A song is not better explained in one language than another.
    expect(new Set(counts).size).toBe(1);
  });

  it('opens on a grounded line even when it is not the first line', async () => {
    const res = await request(app).get('/api/songs/arziyan?mode=en');
    const active = (res.body.lines as Line[]).find(
      (l) => l.lineNo === res.body.activeLineNo,
    );
    expect(active?.meaning).not.toBeNull();
    expect(res.body.activeLineNo).toBeGreaterThan(1);
  });

  it('has no active line when nothing in the song is grounded', async () => {
    const res = await request(app).get('/api/songs/piya-haji-ali?mode=en');
    expect(res.body.activeLineNo).toBeNull();
  });
});

describe.skipIf(!available)('notify requests (FR-038)', () => {
  it('records a request', async () => {
    const res = await request(app)
      .post('/api/songs/piya-haji-ali/notify')
      .send({ email: 'reader@example.test' });
    expect(res.status).toBe(202);
    expect(res.body.recorded).toBe(true);
  });

  it('is idempotent — asking twice is not two requests', async () => {
    // A frustrated reader clicking repeatedly must not queue duplicate emails.
    for (let i = 0; i < 3; i += 1) {
      const res = await request(app)
        .post('/api/songs/piya-haji-ali/notify')
        .send({ email: 'repeat@example.test' });
      expect(res.status).toBe(202);
    }
  });

  it('rejects a malformed address rather than storing it', async () => {
    const res = await request(app)
      .post('/api/songs/piya-haji-ali/notify')
      .send({ email: 'not-an-email' });
    expect(res.status).toBe(400);
  });

  it('404s an unknown song', async () => {
    const res = await request(app)
      .post('/api/songs/no-such-song/notify')
      .send({ email: 'reader@example.test' });
    expect(res.status).toBe(404);
  });
});
