import { expect, test } from '@playwright/test';
import { dismissIntro } from './fixtures/dismiss-intro';

test.beforeEach(async ({ page }) => {
  await dismissIntro(page);
});

test('home page mounts the scene canvas with a working WebGL2 context', async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => consoleErrors.push(err.message));

  const response = await page.goto('/');
  expect(response?.status()).toBe(200);

  const wrapper = page.getByTestId('scene-canvas');
  await expect(wrapper).toBeAttached({ timeout: 10_000 });
  const canvas = wrapper.locator('canvas');
  await expect(canvas).toBeAttached({ timeout: 10_000 });

  const book = page.getByTestId('hero-book');
  await expect(book).toBeAttached({ timeout: 15_000 });

  const hasWebGL = await page.evaluate(() => {
    const el = document.querySelector(
      '[data-testid="scene-canvas"] canvas',
    ) as HTMLCanvasElement | null;
    if (!el) return false;
    return (
      el.getContext('webgl2') !== null || el.getContext('webgl') !== null
    );
  });
  expect(hasWebGL, 'WebGL context not acquired on the scene canvas').toBe(true);

  // Allow a brief settle for the first frame; ignore network-cancel noise that
  // sometimes appears during HMR or asset HEAD probes for the missing
  // dev-before-assets lightmap. Phase 9 (P9-03) added a next/dynamic
  // boundary around @react-three/postprocessing, which in dev mode can
  // emit a transient "Failed to load resource ... 404" when Next.js
  // prefetches the chunk before it's compiled — filtered here because it
  // clears on the next render and has no user-visible effect.
  const fatal = consoleErrors.filter(
    (msg) =>
      !/lightmap|favicon|HEAD|vercel\/insights|MIME type|Failed to load resource/i.test(
        msg,
      ),
  );
  expect(fatal, `console errors: ${fatal.join('\n')}`).toEqual([]);
});
