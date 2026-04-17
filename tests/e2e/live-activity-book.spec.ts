import { expect, test } from '@playwright/test';
import { dismissIntro } from './fixtures/dismiss-intro';

test.beforeEach(async ({ page }) => {
  await dismissIntro(page);
});

test('live-activity-book renders fixture events and contribution grid', async ({
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

  const feed = page.getByTestId('events-feed');
  await expect(feed).toBeVisible({ timeout: 15_000 });

  const links = feed.locator('a[href^="https://github.com/"]');
  await expect(links.first()).toBeVisible();
  const count = await links.count();
  expect(count).toBeGreaterThanOrEqual(10);

  const firstLink = links.first();
  await expect(firstLink).toHaveAttribute('target', '_blank');
  await expect(firstLink).toHaveAttribute('rel', 'noopener noreferrer');

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
