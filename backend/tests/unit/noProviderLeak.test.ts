import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Guards research.md R-10: no model-provider detail may exist outside
 * `src/llm/providers/`.
 *
 * The failure this prevents is slow and expensive: a provider type or endpoint
 * creeps into a service, nothing breaks, and the leak is only discovered on the
 * day someone tries to switch provider — by which point it is a refactor rather
 * than a new file. Free tier to paid, or one model for the chatbot and another
 * for generation, both make that day arrive.
 */

const SRC = new URL('../../src/', import.meta.url).pathname;
const ALLOWED_DIR = join(SRC, 'llm', 'providers');

/** Vendor markers that belong only inside an adapter. */
const VENDOR_MARKERS = [
  '@google/generative-ai',
  '@anthropic-ai',
  'openai',
  'generativelanguage.googleapis.com',
  'api.anthropic.com',
  'api.openai.com',
  '/api/generate',
];

async function walk(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) return walk(full);
      return entry.name.endsWith('.ts') ? [full] : [];
    }),
  );
  return files.flat();
}

describe('model provider isolation', () => {
  it('keeps every vendor detail inside src/llm/providers/', async () => {
    const files = await walk(SRC);
    const leaks: string[] = [];

    for (const file of files) {
      if (file.startsWith(ALLOWED_DIR)) continue;
      const contents = await readFile(file, 'utf8');
      for (const marker of VENDOR_MARKERS) {
        if (contents.includes(marker)) {
          leaks.push(`${relative(SRC, file)} mentions "${marker}"`);
        }
      }
    }

    expect(leaks, `Vendor detail outside src/llm/providers/:\n${leaks.join('\n')}`).toEqual([]);
  });

  it('has adapters to isolate in the first place', async () => {
    // Guards the guard: if the providers directory were renamed or emptied, the
    // test above would pass vacuously and prove nothing.
    const adapters = await readdir(ALLOWED_DIR);
    expect(adapters.filter((f) => f.endsWith('.ts')).length).toBeGreaterThan(0);
  });

  it('exposes only the interface from the llm entry point', async () => {
    const index = await readFile(join(SRC, 'llm', 'index.ts'), 'utf8');
    // Services import from here; it must not re-export anything vendor-shaped.
    for (const marker of VENDOR_MARKERS) {
      expect(index).not.toContain(marker);
    }
  });
});
