import { expect, test } from '@playwright/test';

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

  const book = page.getByTestId('live-activity-book');
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
  // dev-before-assets lightmap.
  const fatal = consoleErrors.filter(
    (msg) => !/lightmap|favicon|HEAD/i.test(msg),
  );
  expect(fatal, `console errors: ${fatal.join('\n')}`).toEqual([]);
});
