import { spawn, type ChildProcess } from 'node:child_process';
import { createServer } from 'node:net';
import { expect, test } from '@playwright/test';

// Error-path e2e. Spawns its own dev server on an OS-assigned ephemeral port
// with `GITHUB_PAT=bad` so the real `fetchGithubSnapshot` fails and `page.tsx`
// returns null. Server stdout is piped into the test process so we can verify
// the `page.github_fetch_failed` log topic — that topic is the proxy for
// §7.2's `github_fetch_error_total` metric inside the e2e process.
//
// The spec previously hard-coded port 3017 which collided with the shared
// Playwright-managed dev server on Windows (Phase 7 Deviation 6 /
// Phase 9 full-suite evidence row 1 — EADDRINUSE). P10-00e switches to
// `net.createServer().listen(0)` to let the OS pick a free port. There is a
// small TOCTOU window between closing the probe server and the child
// binding, but it is vastly safer than a hard-coded port on developer
// machines where any other dev server may already own 3017.

const ERROR_COPY = "GitHub hasn't replied yet — try again in a moment.";
const BOOT_TIMEOUT_MS = 180_000;

test.describe.configure({ mode: 'serial' });

let server: ChildProcess | null = null;
let capturedOutput = '';
let errorUrl = '';

const pickFreePort = (): Promise<number> =>
  new Promise((resolve, reject) => {
    const probe = createServer();
    probe.unref();
    probe.on('error', reject);
    probe.listen(0, '127.0.0.1', () => {
      const addr = probe.address();
      if (addr === null || typeof addr === 'string') {
        probe.close();
        reject(new Error('failed to obtain ephemeral port'));
        return;
      }
      const { port } = addr;
      probe.close((closeErr) => {
        if (closeErr) reject(closeErr);
        else resolve(port);
      });
    });
  });

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
  const port = await pickFreePort();
  errorUrl = `http://localhost:${port}`;
  // eslint-disable-next-line no-console
  console.log(
    `[error-spec] spawning dev server on ephemeral port ${port} …`,
  );
  const isWin = process.platform === 'win32';
  server = spawn(
    isWin ? 'pnpm.cmd' : 'pnpm',
    ['next', 'dev', '--port', String(port)],
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
  await waitForReady(server, errorUrl);
  // Warmup: pre-compile the route so the test's page.goto doesn't race
  // against Next.js dev-time JIT compilation.
  try {
    await fetch(errorUrl, { redirect: 'manual' });
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
  const response = await page.goto(errorUrl);
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
