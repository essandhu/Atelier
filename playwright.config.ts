import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.PORT ?? 3000);
const baseURL = `http://localhost:${port}`;
// Mobile project is opt-in — Chromium mobile emulation does provide a
// `DeviceOrientationEvent` constructor, but some Linux CI runners without
// GPU acceleration run mobile specs flakily. Matching the ATELIER_PERF_HARDGATE
// pattern: CI sets ATELIER_MOBILE_E2E=1 on preview deploys where the hardware
// is dependable, and keeps it off on main CI.
const MOBILE_E2E = process.env.ATELIER_MOBILE_E2E === '1';

// Playwright's single dev server runs in fixture mode so the happy-path and
// scene smoke specs get a deterministic GithubSnapshot. The legacy GitHub
// fetch-failure spec (`live-activity-error.spec.ts`) was retired in P10-19:
// the Pinboard only mounts when `githubSnapshot` is truthy (Scene.tsx), so
// the fail-silent degraded state has no in-character DOM surface to assert
// against.
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
    ...(MOBILE_E2E
      ? [
          {
            name: 'mobile-chrome',
            use: { ...devices['Pixel 5'] },
            // Only run specs that opt into mobile — the device-orientation
            // spec self-skips when the env flag is absent, so listing the
            // pattern here keeps the other specs (globe, webcam-flow, etc.)
            // from running twice under a mobile viewport.
            testMatch: /device-orientation\.spec\.ts/,
          },
        ]
      : []),
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
