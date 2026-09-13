import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import { ensureTestDatabase, postgresAvailable, TEST_DATABASE_URL } from '../helpers/db.js';

/**
 * No route in this feature consumes quota. Ever. FR-015, FR-028. T081.
 *
 * The whole economic shape of the product rests on this: reading an
 * already-explained song is free and unlimited, because serving it costs
 * almost nothing. The paywall sits on RESEARCH, the expensive operation.
 *
 * If viewing ever started decrementing, the free tier would stop being useful
 * and the paywall would land on the wrong side of the value — so this is
 * asserted rather than assumed.
 */

const available = await postgresAvailable();
if (available) {
  await ensureTestDatabase();
  process.env['DATABASE_URL'] = TEST_DATABASE_URL;
}

const { createApp } = await import('../../src/app.js');
const { config } = await import('../../src/config/index.js');
const { migrate } = await import('../../src/db/migrate.js');
const { seed } = await import('../../src/db/seed/index.js');

const app = createApp();
const basic = jwt.sign({ sub: 'u-quota', plan: 'basic' }, config.JWT_SECRET);

async function remaining(): Promise<number> {
  const res = await request(app)
    .get('/api/songs/kun-faya-kun?mode=en')
    .set('Authorization', `Bearer ${basic}`);
  return res.body.viewer.quota.remaining as number;
}

describe.skipIf(!available)('viewing never consumes quota', () => {
  beforeAll(async () => {
    await migrate();
    await seed();
  }, 120_000);

  it('does not move after reading the same song repeatedly', async () => {
    const before = await remaining();
    for (let i = 0; i < 5; i += 1) {
      await request(app)
        .get('/api/songs/kun-faya-kun?mode=en')
        .set('Authorization', `Bearer ${basic}`);
    }
    expect(await remaining()).toBe(before);
  });

  it('does not move across every song in the catalogue', async () => {
    const before = await remaining();
    for (const slug of ['kun-faya-kun', 'arziyan', 'piya-haji-ali', 'tere-bina']) {
      await request(app).get(`/api/songs/${slug}?mode=en`).set('Authorization', `Bearer ${basic}`);
    }
    expect(await remaining()).toBe(before);
  });

  it('does not move when switching language (FR-015)', async () => {
    // A mode change is a rendering change, not a new explanation. Charging for
    // it would make the three-language promise cost something to use.
    const before = await remaining();
    for (const mode of ['hi', 'hi-Latn', 'en', 'hi']) {
      await request(app)
        .get(`/api/songs/kun-faya-kun?mode=${mode}`)
        .set('Authorization', `Bearer ${basic}`);
    }
    expect(await remaining()).toBe(before);
  });

  it('does not move when opening word meanings or sources', async () => {
    const before = await remaining();
    const page = await request(app)
      .get('/api/songs/kun-faya-kun?mode=en')
      .set('Authorization', `Bearer ${basic}`);

    const line = page.body.lines.find((l: { meaning: unknown }) => l.meaning !== null);
    await request(app)
      .get(`/api/meanings/${line.meaning.meaningId}/sources?mode=en`)
      .set('Authorization', `Bearer ${basic}`);

    for (const word of line.words as Array<{ occurrenceId: string }>) {
      await request(app)
        .get(`/api/songs/kun-faya-kun/words/${word.occurrenceId}?mode=en`)
        .set('Authorization', `Bearer ${basic}`);
    }

    expect(await remaining()).toBe(before);
  });

  it('does not move when a refused chatbot request is made', async () => {
    const before = await remaining();
    await request(app).post('/api/chat/kun-faya-kun').set('Authorization', `Bearer ${basic}`);
    // A refusal costs the user nothing: they got nothing.
    expect(await remaining()).toBe(before);
  });
});
