import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.PORT ?? 3000);
const baseURL = `http://localhost:${port}`;

// Playwright's single dev server runs in fixture mode so the happy-path and
// scene smoke specs get a deterministic GithubSnapshot. The error spec
// (`live-activity-error.spec.ts`) spawns its own dev server on port 3017
// with `GITHUB_PAT=bad` — see that file for details.
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  reporter: [['list']],
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'pnpm dev',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      NEXT_PUBLIC_GITHUB_MODE: 'fixture',
      GITHUB_USERNAME: 'atelier-fixture',
      GITHUB_PAT: process.env.GITHUB_PAT ?? 'ghp_fixture_mode',
      REVALIDATE_SECRET:
        process.env.REVALIDATE_SECRET ?? 'playwright-revalidate-secret',
      LOG_LEVEL: 'info',
    },
  },
});
