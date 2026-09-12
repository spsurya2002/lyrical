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
  // Starts BOTH the API and the web app from the repo root. The song page is
  // useless without the API, so an e2e run that only started Vite would fail in
  // a way that looked like a UI bug.
  webServer: {
    command: 'npm run dev',
    cwd: '..',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
