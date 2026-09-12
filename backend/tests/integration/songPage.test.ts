import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import { ensureTestDatabase, postgresAvailable, TEST_DATABASE_URL } from '../helpers/db.js';
import { hasDevanagari, hasProhibitedScript } from '../helpers/script.js';

/**
 * Song page contract and grounding behaviour, against a real Postgres seeded
 * with the five fixture songs.
 *
 * T028, T034, T035.
 */

const available = await postgresAvailable();
if (available) {
  await ensureTestDatabase();
  process.env['DATABASE_URL'] = TEST_DATABASE_URL;
}

// Imported after DATABASE_URL is set: config reads env at module load.
const { createApp } = await import('../../src/app.js');
const { migrate } = await import('../../src/db/migrate.js');
const { seed } = await import('../../src/db/seed/index.js');

const app = createApp();


describe.skipIf(!available)('song page', () => {
  beforeAll(async () => {
    await migrate();
    await seed();
  }, 120_000);

  describe('reading a grounded song (US1)', () => {
    it('returns the song with its lines and a grounded meaning', async () => {
      const res = await request(app).get('/api/songs/kun-faya-kun?mode=en');
      expect(res.status).toBe(200);
      expect(res.body.song.slug).toBe('kun-faya-kun');
      expect(res.body.lines.length).toBeGreaterThan(0);
    });

    it('opens on the first SERVABLE line, not line one', async () => {
      const res = await request(app).get('/api/songs/kun-faya-kun?mode=en');
      // Line 1 is ungrounded in the fixture; landing there would show an empty
      // panel while line 2 is explained.
      expect(res.body.activeLineNo).toBe(2);
      const first = res.body.lines.find((l: { lineNo: number }) => l.lineNo === 1);
      expect(first.meaning).toBeNull();
    });

    it('reports a source count on every meaning it serves', async () => {
      const res = await request(app).get('/api/songs/kun-faya-kun?mode=en');
      for (const line of res.body.lines) {
        if (line.meaning !== null) {
          expect(line.meaning.sourceCount).toBeGreaterThanOrEqual(4);
        }
      }
    });

    it('404s an unknown slug', async () => {
      const res = await request(app).get('/api/songs/no-such-song');
      expect(res.status).toBe(404);
    });

    it('400s an unknown mode rather than guessing one', async () => {
      const res = await request(app).get('/api/songs/kun-faya-kun?mode=fr');
      expect(res.status).toBe(400);
    });
  });

  describe('grounding — Principle I', () => {
    it('never serves a meaning and an ungrounded state on the same line', async () => {
      // The product has no third answer: exactly one of these is non-null.
      const res = await request(app).get('/api/songs/arziyan?mode=en');
      for (const line of res.body.lines) {
        expect(line.meaning === null).toBe(line.ungrounded !== null);
      }
    });

    it('withholds a meaning that falls below the four-source bar', async () => {
      const res = await request(app).get('/api/songs/piya-haji-ali?mode=en');
      const withMeaning = res.body.lines.filter(
        (l: { meaning: unknown }) => l.meaning !== null,
      );
      expect(withMeaning).toHaveLength(0);
    });

    it('discloses the shortfall rather than only refusing (FR-037)', async () => {
      const res = await request(app).get('/api/songs/piya-haji-ali?mode=en');
      const belowBar = res.body.lines.find(
        (l: { ungrounded: { reason: string } }) => l.ungrounded.reason === 'below_bar',
      );
      expect(belowBar.ungrounded.sourceCount).toBe(2);
      expect(belowBar.ungrounded.sourcesRequired).toBe(4);
    });

    it('is honest per line on a partly grounded song (D-001)', async () => {
      const res = await request(app).get('/api/songs/arziyan?mode=en');
      expect(res.body.coverage.linesTotal).toBe(26);
      expect(res.body.coverage.linesExplained).toBe(4);
    });

    it('withholds a summary that is not itself grounded (FR-024)', async () => {
      // arziyan has explained lines but no summary: one assembled from four of
      // twenty-six lines would be a guess.
      const res = await request(app).get('/api/songs/arziyan?mode=en');
      expect(res.body.summary).toBeNull();
      expect(res.body.summaryUngrounded).not.toBeNull();
    });

    it('keeps a stale meaning readable while it is regenerated (FR-007)', async () => {
      const res = await request(app).get('/api/songs/tere-bina?mode=en');
      const stale = res.body.lines.find(
        (l: { meaning: { status: string } | null }) => l.meaning?.status === 'stale',
      );
      expect(stale).toBeDefined();
      expect(stale.meaning.text.length).toBeGreaterThan(0);
    });
  });

  describe('the script boundary — Principle III', () => {
    it('emits no Arabic or Urdu script in any mode', async () => {
      for (const mode of ['en', 'hi', 'hi-Latn']) {
        for (const slug of ['kun-faya-kun', 'piya-haji-ali', 'arziyan', 'tere-bina']) {
          const res = await request(app).get(`/api/songs/${slug}?mode=${mode}`);
          expect(hasProhibitedScript(JSON.stringify(res.body)), `${slug} in ${mode}`).toBe(false);
        }
      }
    });

    it('renders Devanagari in Hindi mode and Latin in the others', async () => {
      const hi = await request(app).get('/api/songs/kun-faya-kun?mode=hi');
      expect(hasDevanagari(hi.body.song.title)).toBe(true);

      for (const mode of ['en', 'hi-Latn']) {
        const res = await request(app).get(`/api/songs/kun-faya-kun?mode=${mode}`);
        expect(hasDevanagari(JSON.stringify(res.body))).toBe(false);
      }
    });

    it('tags the language so screen readers switch voice (FR-034)', async () => {
      const res = await request(app).get('/api/songs/kun-faya-kun?mode=hi-Latn');
      expect(res.body.lang).toBe('hi-Latn');
    });
  });

  describe('sources (FR-004)', () => {
    it('returns the excerpt actually used', async () => {
      const page = await request(app).get('/api/songs/kun-faya-kun?mode=en');
      const meaningId = page.body.lines.find(
        (l: { meaning: unknown }) => l.meaning !== null,
      ).meaning.meaningId;

      const res = await request(app).get(`/api/meanings/${meaningId}/sources?mode=en`);
      expect(res.status).toBe(200);
      expect(res.body.sources.length).toBeGreaterThanOrEqual(4);
    });

    it('withholds an Urdu-script excerpt but keeps the source listed', async () => {
      // The regression this guards: the excerpt was served raw, leaking Urdu
      // script into an English page. Dropping the source instead would have
      // silently lowered the visible grounding.
      const page = await request(app).get('/api/songs/kun-faya-kun?mode=en');
      const meaningId = page.body.lines.find(
        (l: { meaning: unknown }) => l.meaning !== null,
      ).meaning.meaningId;

      const res = await request(app).get(`/api/meanings/${meaningId}/sources?mode=en`);
      expect(hasProhibitedScript(JSON.stringify(res.body))).toBe(false);

      const withheld = res.body.sources.filter(
        (s: { excerptWithheld: boolean }) => s.excerptWithheld,
      );
      expect(withheld).toHaveLength(1);
      expect(withheld[0].domain).toBe('rekhta.org');
      expect(withheld[0].url).toBeTruthy();
    });

    it('lists an unreachable source, marked, because it still counts', async () => {
      const page = await request(app).get('/api/songs/tere-bina?mode=en');
      const meaningId = page.body.lines.find(
        (l: { meaning: unknown }) => l.meaning !== null,
      ).meaning.meaningId;

      const res = await request(app).get(`/api/meanings/${meaningId}/sources?mode=en`);
      const dead = res.body.sources.filter((s: { reachable: boolean }) => !s.reachable);
      expect(dead).toHaveLength(1);
    });
  });

  describe('quota — FR-028', () => {
    it('consumes nothing, in any mode, however many times the page is read', async () => {
      for (const mode of ['en', 'hi', 'hi-Latn', 'en']) {
        const res = await request(app).get(`/api/songs/kun-faya-kun?mode=${mode}`);
        expect(res.status).toBe(200);
        // Signed out: no viewer block at all, and nothing to decrement.
        expect(res.body.viewer).toBeNull();
      }
    });
  });
});
