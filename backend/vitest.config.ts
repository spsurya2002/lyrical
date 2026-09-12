import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // Integration tests spin up a real Postgres via Testcontainers (R-08) —
    // the grounding rule depends on aggregate behaviour a fake would not reproduce.
    testTimeout: 60_000,
    hookTimeout: 120_000,
    // config/index.ts refuses to boot without these, by design. Supplying them
    // here keeps `npm test` working on a clean checkout with no .env, and keeps
    // the validation strict everywhere else. Integration tests override the
    // connection strings with their Testcontainers values.
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'postgres://lyricsense:lyricsense@localhost:5432/lyricsense_test',
      REDIS_URL: 'redis://localhost:6379',
      JWT_SECRET: 'test-secret-not-used-outside-tests',
    },
  },
});
