import { expect, test } from '@playwright/test';

test('/fallback renders every content section', async ({ page }) => {
  const response = await page.goto('/fallback');
  expect(response?.status()).toBe(200);

  for (const id of ['profile', 'projects', 'skills', 'experience', 'activity']) {
    await expect(page.locator(`#${id}`)).toBeVisible();
  }

  await expect(page.getByTestId('contribution-total-fallback')).toBeVisible();
});

test.describe('no-JS fallback', () => {
  test.use({ javaScriptEnabled: false });

  test('GET / contains a noscript meta-refresh to /fallback', async ({
    page,
  }) => {
    // With JS disabled the meta-refresh fires synchronously, so `page.content()`
    // races with the navigation. Grab the raw response body from the HTTP
    // request instead of relying on the live DOM snapshot.
    const response = await page.goto('/', { waitUntil: 'commit' });
    const html = (await response?.text()) ?? '';
    expect(html).toContain('http-equiv="refresh"');
    expect(html).toContain('url=/fallback');
  });
});
