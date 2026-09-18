import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    // US5: the mobile sheet and 44px word targets are only meaningful here.
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  // TWO servers, each health-checked separately.
  //
  // A single entry pointing at Vite was reused whenever :5173 was up — even when
  // the API behind it was dead. Every page then rendered empty and every failure
  // looked like a UI bug. Declaring the API separately means a half-dead stack
  // cannot be reused: Playwright checks :3000/health too, and starts what is
  // missing.
  webServer: [
    {
      command: 'npm run dev:api',
      cwd: '..',
      url: 'http://localhost:3000/health',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        // A whole browser suite runs from one IP, so it shares a single
        // rate-limit bucket — something no real user does. At the production
        // ceiling of 600 the suite exhausted it (1,263 requests across two runs)
        // and pages came back empty, which looks exactly like a UI bug.
        //
        // The limiter stays ATTACHED; only its ceiling moves. A route that
        // forgot its limiter is still detectable, and the contract tests still
        // prove the gate works.
        RATE_LIMIT_READ_PER_MINUTE: '100000',
      },
    },
    {
      command: 'npm run dev:web',
      cwd: '..',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
