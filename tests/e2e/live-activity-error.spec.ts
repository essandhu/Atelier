import { spawn, type ChildProcess } from 'node:child_process';
import { expect, test } from '@playwright/test';

// Error-path e2e. Spawns its own dev server on an isolated port with
// `GITHUB_PAT=bad` so the real `fetchGithubSnapshot` fails and `page.tsx`
// returns null. Server stdout is piped into the test process so we can verify
// the `page.github_fetch_failed` log topic — that topic is the proxy for
// §7.2's `github_fetch_error_total` metric inside the e2e process.

const ERROR_COPY = "GitHub hasn't replied yet — try again in a moment.";
const ERROR_PORT = 3017;
const ERROR_URL = `http://localhost:${ERROR_PORT}`;
const BOOT_TIMEOUT_MS = 180_000;

test.describe.configure({ mode: 'serial' });

let server: ChildProcess | null = null;
let capturedOutput = '';

const waitForReady = async (
  proc: ChildProcess,
  url: string,
): Promise<void> => {
  const deadline = Date.now() + BOOT_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (proc.exitCode !== null) {
      throw new Error(
        `dev server exited with ${proc.exitCode} before becoming ready. output:\n${capturedOutput}`,
      );
    }
    if (/EADDRINUSE/i.test(capturedOutput)) {
      throw new Error(
        `dev server failed: port already in use. Kill the lingering process and retry. output:\n${capturedOutput}`,
      );
    }
    try {
      const r = await fetch(url, { redirect: 'manual' });
      if (r.status >= 200 && r.status < 500) return;
    } catch {
      // not up yet
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(
    `dev server did not become ready within ${BOOT_TIMEOUT_MS}ms. output:\n${capturedOutput}`,
  );
};

test.beforeAll(async ({}, testInfo) => {
  testInfo.setTimeout(240_000);
  // eslint-disable-next-line no-console
  console.log(
    `[error-spec] spawning dev server on port ${ERROR_PORT} …`,
  );
  const isWin = process.platform === 'win32';
  server = spawn(
    isWin ? 'pnpm.cmd' : 'pnpm',
    ['next', 'dev', '--port', String(ERROR_PORT)],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        NEXT_PUBLIC_GITHUB_MODE: 'live',
        GITHUB_PAT: 'bad',
        GITHUB_USERNAME: 'atelier-error-test',
        REVALIDATE_SECRET: 'revalidate-secret',
        LOG_LEVEL: 'info',
      },
      shell: isWin,
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
  server.stdout?.setEncoding('utf8');
  server.stderr?.setEncoding('utf8');
  server.stdout?.on('data', (d: string) => {
    capturedOutput += d;
    // eslint-disable-next-line no-console
    process.stdout.write(`[error-server] ${d}`);
  });
  server.stderr?.on('data', (d: string) => {
    capturedOutput += d;
    // eslint-disable-next-line no-console
    process.stderr.write(`[error-server] ${d}`);
  });
  await waitForReady(server, ERROR_URL);
  // Warmup: pre-compile the route so the test's page.goto doesn't race
  // against Next.js dev-time JIT compilation.
  try {
    await fetch(ERROR_URL, { redirect: 'manual' });
  } catch {
    // ignore; test will report
  }
});

test.afterAll(async () => {
  if (server && server.exitCode === null) {
    server.kill('SIGTERM');
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (server.exitCode === null) server.kill('SIGKILL');
  }
});

test('live-activity-book renders the error branch when the GitHub fetch fails', async ({
  page,
}) => {
  const response = await page.goto(ERROR_URL);
  expect(response?.status()).toBe(200);

  const canvas = page.getByTestId('scene-canvas');
  await expect(canvas).toBeAttached({ timeout: 15_000 });

  const error = page.getByTestId('live-activity-error');
  await expect(error).toBeAttached({ timeout: 15_000 });
  await expect(error).toContainText(ERROR_COPY);

  const feed = page.getByTestId('events-feed');
  await expect(feed).toHaveCount(0);

  await expect
    .poll(() => capturedOutput.includes('page.github_fetch_failed'), {
      message: 'expected dev-server stdout to contain page.github_fetch_failed',
      timeout: 15_000,
    })
    .toBe(true);
});
