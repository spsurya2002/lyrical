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
  },
});
