import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import { ensureTestDatabase, postgresAvailable, TEST_DATABASE_URL } from '../helpers/db.js';
import { hasProhibitedScript } from '../helpers/script.js';

/**
 * Word identity — the spec's hardest idea (FR-018, FR-019).
 * T060, T061.
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

interface Word {
  occurrenceId: string;
  text: string;
}
interface Line {
  lineNo: number;
  words: Word[];
  meaning: unknown;
}

async function wordsOf(slug: string, mode = 'en'): Promise<Array<Word & { lineNo: number }>> {
  const res = await request(app).get(`/api/songs/${slug}?mode=${mode}`);
  return (res.body.lines as Line[]).flatMap((line) =>
    line.words.map((w) => ({ ...w, lineNo: line.lineNo })),
  );
}

describe.skipIf(!available)('word meanings', () => {
  beforeAll(async () => {
    await migrate();
    await seed();
  }, 120_000);

  it('exposes selectable words even on lines with no meaning of their own', async () => {
    // The bug this guards: `words` was nested under `meaning`, so a grounded
    // word on an unexplained line was unreachable — which under per-line
    // honesty is the normal case, not an edge case.
    const words = await wordsOf('khwaja-mere-khwaja');
    expect(words.length).toBeGreaterThan(0);

    const res = await request(app).get('/api/songs/khwaja-mere-khwaja?mode=en');
    const everyLineUnexplained = (res.body.lines as Line[]).every((l) => l.meaning === null);
    expect(everyLineUnexplained).toBe(true);
  });

  it('returns a word meaning in the context of this song', async () => {
    const [word] = await wordsOf('kun-faya-kun');
    expect(word).toBeDefined();
    const res = await request(app).get(
      `/api/songs/kun-faya-kun/words/${word?.occurrenceId}?mode=en`,
    );
    expect(res.status).toBe(200);
    expect(res.body.meaning.text.length).toBeGreaterThan(0);
    expect(res.body.meaning.sourceCount).toBeGreaterThanOrEqual(4);
  });

  it('gives two occurrences of one spelling two different meanings', async () => {
    const words = await wordsOf('khwaja-mere-khwaja');
    const [first, second] = words;
    expect(first?.text).toBe(second?.text);

    const a = await request(app).get(
      `/api/songs/khwaja-mere-khwaja/words/${first?.occurrenceId}?mode=en`,
    );
    const b = await request(app).get(
      `/api/songs/khwaja-mere-khwaja/words/${second?.occurrenceId}?mode=en`,
    );

    expect(a.body.meaning.meaningId).not.toBe(b.body.meaning.meaningId);
    expect(a.body.meaning.text).not.toBe(b.body.meaning.text);
  });

  it('states that the uses differ, from both directions', async () => {
    const words = await wordsOf('khwaja-mere-khwaja');
    for (const word of words) {
      const res = await request(app).get(
        `/api/songs/khwaja-mere-khwaja/words/${word.occurrenceId}?mode=en`,
      );
      expect(res.body.hasDivergentUses).toBe(true);
      expect(res.body.otherOccurrences.some((o: { differs: boolean }) => o.differs)).toBe(true);
    }
  });

  it('does not claim a difference when a word appears only once', async () => {
    // Asserting divergence that no source supports would be its own kind of
    // invention.
    const [word] = await wordsOf('kun-faya-kun');
    const res = await request(app).get(
      `/api/songs/kun-faya-kun/words/${word?.occurrenceId}?mode=en`,
    );
    expect(res.body.hasDivergentUses).toBe(false);
  });

  it('renders word meanings in all three modes with no prohibited script', async () => {
    for (const mode of ['en', 'hi', 'hi-Latn']) {
      const words = await wordsOf('khwaja-mere-khwaja', mode);
      for (const word of words) {
        const res = await request(app).get(
          `/api/songs/khwaja-mere-khwaja/words/${word.occurrenceId}?mode=${mode}`,
        );
        expect(res.status).toBe(200);
        expect(hasProhibitedScript(JSON.stringify(res.body)), `${word.text} in ${mode}`).toBe(
          false,
        );
      }
    }
  });

  it('404s an unknown occurrence, and 400s a malformed id', async () => {
    const missing = await request(app).get(
      '/api/songs/kun-faya-kun/words/00000000-0000-4000-8000-000000000000?mode=en',
    );
    expect(missing.status).toBe(404);

    const malformed = await request(app).get('/api/songs/kun-faya-kun/words/not-a-uuid?mode=en');
    expect(malformed.status).toBe(400);
  });
});
