import type { PoolClient } from 'pg';
import { closePool, pool } from '../pool.js';
import {
  allSongs,
  SOURCES,
  type MeaningFixture,
  type SongFixture,
} from './fixtures.js';

/**
 * Loads the five fixture songs. Idempotent: truncates the read model first, so
 * running it twice gives the same database rather than duplicates.
 *
 * Fixture content is illustrative, not authoritative — see fixtures.ts.
 */

async function insertSources(client: PoolClient): Promise<Map<string, string>> {
  const ids = new Map<string, string>();
  for (const s of SOURCES) {
    const { rows } = await client.query<{ id: string }>(
      `INSERT INTO source (url, domain, type, excerpt, reachable)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [s.url, s.domain, s.type, s.excerpt, s.reachable ?? true],
    );
    const id = rows[0]?.id;
    if (id === undefined) throw new Error(`source insert returned no id: ${s.key}`);
    ids.set(s.key, id);
  }
  return ids;
}

async function insertMeaning(
  client: PoolClient,
  sourceIds: Map<string, string>,
  targetType: 'song_summary' | 'line' | 'word_occurrence',
  targetId: string,
  fixture: MeaningFixture,
): Promise<void> {
  const { rows } = await client.query<{ id: string }>(
    `INSERT INTO meaning (target_type, target_id, status) VALUES ($1, $2, $3) RETURNING id`,
    [targetType, targetId, fixture.status ?? 'active'],
  );
  const meaningId = rows[0]?.id;
  if (meaningId === undefined) throw new Error(`meaning insert returned no id for ${targetId}`);

  for (const mode of ['en', 'hi', 'hi-Latn'] as const) {
    await client.query(
      `INSERT INTO meaning_rendering (meaning_id, mode, text, validated_at)
       VALUES ($1, $2, $3, now())`,
      [meaningId, mode, fixture.text[mode]],
    );
  }

  for (const key of fixture.sources) {
    const sourceId = sourceIds.get(key);
    if (sourceId === undefined) throw new Error(`unknown source key: ${key}`);
    await client.query(
      `INSERT INTO meaning_source (meaning_id, source_id) VALUES ($1, $2)`,
      [meaningId, sourceId],
    );
  }
}

async function insertSong(
  client: PoolClient,
  sourceIds: Map<string, string>,
  song: SongFixture,
): Promise<void> {
  const { rows } = await client.query<{ id: string }>(
    `INSERT INTO song (slug, artist, year, film) VALUES ($1, $2, $3, $4) RETURNING id`,
    [song.slug, song.artist, song.year, song.film ?? null],
  );
  const songId = rows[0]?.id;
  if (songId === undefined) throw new Error(`song insert returned no id: ${song.slug}`);

  for (const script of ['latn', 'deva'] as const) {
    await client.query(`INSERT INTO song_title (song_id, script, text) VALUES ($1, $2, $3)`, [
      songId,
      script,
      song.title[script],
    ]);
  }

  if (song.summary) {
    await insertMeaning(client, sourceIds, 'song_summary', songId, song.summary);
  }

  for (const [index, line] of song.lines.entries()) {
    const lineResult = await client.query<{ id: string }>(
      `INSERT INTO lyric_line (song_id, line_no) VALUES ($1, $2) RETURNING id`,
      [songId, index + 1],
    );
    const lineId = lineResult.rows[0]?.id;
    if (lineId === undefined) throw new Error(`line insert returned no id: ${song.slug}#${index}`);

    await client.query(`INSERT INTO lyric_line_text (line_id, script, text) VALUES ($1,$2,$3)`, [
      lineId,
      'latn',
      line.latn,
    ]);
    await client.query(`INSERT INTO lyric_line_text (line_id, script, text) VALUES ($1,$2,$3)`, [
      lineId,
      'deva',
      line.deva,
    ]);

    if (line.meaning) {
      await insertMeaning(client, sourceIds, 'line', lineId, line.meaning);
    }

    for (const word of line.words ?? []) {
      const wordResult = await client.query<{ id: string }>(
        `INSERT INTO word_occurrence (line_id, position, surface_latn, surface_deva)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [lineId, word.position, word.latn, word.deva],
      );
      const wordId = wordResult.rows[0]?.id;
      if (wordId === undefined) throw new Error(`word insert returned no id`);
      if (word.meaning) {
        await insertMeaning(client, sourceIds, 'word_occurrence', wordId, word.meaning);
      }
    }
  }
}

export async function seed(): Promise<{ songs: number; sources: number }> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Order matters only for readability; every FK cascades from song or meaning.
    await client.query('TRUNCATE meaning_source, meaning_rendering, meaning, source, word_occurrence, lyric_line_text, lyric_line, song_title, song CASCADE');

    const sourceIds = await insertSources(client);
    const songs = allSongs();
    for (const song of songs) {
      await insertSong(client, sourceIds, song);
    }

    await client.query('COMMIT');
    return { songs: songs.length, sources: SOURCES.length };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const { songs, sources } = await seed();
    console.log(`Seeded ${songs} songs and ${sources} sources.`);
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    await closePool();
  }
}
