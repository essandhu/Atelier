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
    await page.goto('/');
    const html = await page.content();
    expect(html).toContain('http-equiv="refresh"');
    expect(html).toContain('url=/fallback');
  });
});
