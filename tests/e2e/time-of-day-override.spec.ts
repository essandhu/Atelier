import { expect, test } from '@playwright/test';
import { dismissIntro } from './fixtures/dismiss-intro';

test.beforeEach(async ({ page }) => {
  await dismissIntro(page);
});

const STATES = ['morning', 'day', 'evening', 'night'] as const;

for (const state of STATES) {
  test(`?time=${state} forces the ${state} state`, async ({ page }) => {
    const response = await page.goto(`/?time=${state}`);
    expect(response?.status()).toBe(200);

    const marker = page.getByTestId('resolved-state');
    await expect(marker).toBeAttached({ timeout: 10_000 });
    await expect(marker).toHaveAttribute('data-state', state);

    const wrapper = page.getByTestId('scene-canvas');
    await expect(wrapper.locator('canvas')).toBeAttached({ timeout: 10_000 });
  });
}

test('invalid ?time value falls through to a valid state', async ({ page }) => {
  await page.goto('/?time=cosmic');
  const marker = page.getByTestId('resolved-state');
  await expect(marker).toBeAttached({ timeout: 10_000 });
  const value = await marker.getAttribute('data-state');
  expect(['morning', 'day', 'evening', 'night']).toContain(value);
});
