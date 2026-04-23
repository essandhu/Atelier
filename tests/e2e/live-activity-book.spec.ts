import { expect, test } from '@playwright/test';
import { dismissIntro } from './fixtures/dismiss-intro';

test.beforeEach(async ({ page }) => {
  await dismissIntro(page);
});

test('live-activity-book renders preview, contribution grid, and exposes a hotspot', async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  const failedUrls: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => consoleErrors.push(err.message));
  page.on('response', (res) => {
    if (res.status() >= 400) failedUrls.push(`${res.status()} ${res.url()}`);
  });

  const response = await page.goto('/');
  expect(response?.status()).toBe(200);

  const canvas = page.getByTestId('scene-canvas');
  await expect(canvas).toBeAttached({ timeout: 15_000 });

  const book = page.getByTestId('live-activity-book');
  await expect(book).toBeAttached({ timeout: 15_000 });

  const grid = page.getByTestId('contribution-grid');
  await expect(grid).toBeAttached({ timeout: 15_000 });

  // The right-page in-scene preview is read-only typography (no anchors).
  // GitHub links live in the EventsFeedPanel that the hotspot opens.
  const feed = page.getByTestId('events-feed');
  await expect(feed).toBeAttached({ timeout: 15_000 });
  expect(await feed.locator('a').count()).toBe(0);

  const hotspot = page.getByTestId('live-activity-hotspot');
  await expect(hotspot).toBeAttached({ timeout: 15_000 });

  const unexpectedFailedUrls = failedUrls.filter(
    (u) => !/lightmap|favicon|HEAD/i.test(u),
  );
  const nonResourceErrors = consoleErrors.filter(
    (msg) => !/Failed to load resource/i.test(msg),
  );
  expect(
    unexpectedFailedUrls,
    `unexpected 4xx/5xx: ${unexpectedFailedUrls.join('\n')}`,
  ).toEqual([]);
  expect(
    nonResourceErrors,
    `console errors: ${nonResourceErrors.join('\n')}`,
  ).toEqual([]);
});

test('hotspot opens EventsFeedPanel with clickable GitHub links', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByTestId('scene-canvas')).toBeAttached({
    timeout: 15_000,
  });
  await expect(page.getByTestId('live-activity-book')).toBeAttached({
    timeout: 15_000,
  });

  const hotspot = page.getByTestId('live-activity-hotspot');
  await expect(hotspot).toBeAttached({ timeout: 15_000 });

  // Activate via keyboard — focus + Enter mirrors the keyboard-first flow.
  await hotspot.focus();
  await page.keyboard.press('Enter');

  const panel = page.getByTestId('events-feed-panel');
  await expect(panel).toBeVisible({ timeout: 5_000 });

  const links = panel.locator('a[href^="https://github.com/"]');
  await expect(links.first()).toBeVisible();
  expect(await links.count()).toBeGreaterThanOrEqual(10);

  const firstLink = links.first();
  await expect(firstLink).toHaveAttribute('target', '_blank');
  await expect(firstLink).toHaveAttribute('rel', 'noopener noreferrer');
});
