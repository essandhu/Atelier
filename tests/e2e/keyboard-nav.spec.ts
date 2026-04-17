import { expect, test } from '@playwright/test';
import { dismissIntro } from './fixtures/dismiss-intro';

test('Tab traversal starts at the skip-to-fallback link', async ({ page }) => {
  await dismissIntro(page);
  await page.goto('/?time=evening');
  await expect(page.getByTestId('scene-canvas').locator('canvas')).toBeAttached(
    { timeout: 10_000 },
  );

  await page.evaluate(() => {
    (document.activeElement as HTMLElement | null)?.blur?.();
    document.body.focus();
  });
  await page.keyboard.press('Tab');

  const first = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    return el
      ? {
          testId: el.getAttribute('data-testid'),
          tabIndex: el.tabIndex,
          tag: el.tagName.toLowerCase(),
        }
      : null;
  });
  expect(first?.testId).toBe('skip-to-fallback');
});

test('The intro Begin button exposes the documented tabIndex', async ({
  page,
}) => {
  await page.goto('/?time=evening');
  await expect(page.getByTestId('intro-overlay')).toBeAttached({
    timeout: 10_000,
  });
  const begin = page.getByTestId('intro-begin');
  await expect(begin).toBeVisible();
  // TAB_ORDER.introBeginButton === 2.
  expect(await begin.getAttribute('tabindex')).toBe('2');
});
