import { expect, test, type Page } from '@playwright/test';
import { dismissIntro } from './fixtures/dismiss-intro';

const focusedTestId = (page: Page): Promise<string | null> =>
  page.evaluate(
    () =>
      (document.activeElement as HTMLElement | null)?.getAttribute(
        'data-testid',
      ) ?? null,
  );

const resetFocusToBody = async (page: Page): Promise<void> => {
  await page.evaluate(() => {
    (document.activeElement as HTMLElement | null)?.blur?.();
    document.body.focus();
  });
};

test('Tab traversal starts at the skip-to-fallback link', async ({ page }) => {
  await dismissIntro(page);
  await page.goto('/?time=evening');
  await expect(page.getByTestId('scene-canvas').locator('canvas')).toBeAttached(
    { timeout: 10_000 },
  );

  await resetFocusToBody(page);
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

test('Tab walks skip → intro Begin → webcam toggle while the intro is visible', async ({
  page,
}) => {
  await page.goto('/?time=evening');
  await expect(page.getByTestId('intro-overlay')).toBeAttached({
    timeout: 10_000,
  });
  // WebcamToggle is hidden on narrow viewports; this spec uses the default
  // Playwright viewport (1280×720) so it renders.
  await expect(page.getByTestId('webcam-toggle')).toBeVisible();

  // IntroOverlay auto-focuses Begin (tabIndex=2) on mount. Walk the sequence
  // from there: Shift+Tab back to skip-to-fallback (1), then Tab forward
  // through the full chain.
  await expect.poll(() => focusedTestId(page)).toBe('intro-begin');

  await page.keyboard.press('Shift+Tab');
  expect(await focusedTestId(page)).toBe('skip-to-fallback');

  await page.keyboard.press('Tab');
  expect(await focusedTestId(page)).toBe('intro-begin');

  await page.keyboard.press('Tab');
  expect(await focusedTestId(page)).toBe('webcam-toggle');
});

test('After dismissing intro, Tab walks skip → project books in TAB_ORDER sequence', async ({
  page,
}) => {
  await dismissIntro(page);
  await page.goto('/?time=evening');
  await expect(page.getByTestId('scene-canvas').locator('canvas')).toBeAttached(
    { timeout: 15_000 },
  );
  await expect(page.getByTestId('project-book-stack')).toBeAttached({
    timeout: 15_000,
  });

  await resetFocusToBody(page);

  // Skip link is the first positive-tabIndex stop (TAB_ORDER.skipToFallback = 1).
  await page.keyboard.press('Tab');
  expect(await focusedTestId(page)).toBe('skip-to-fallback');

  // With the intro dismissed, intro-begin and webcam-toggle are unmounted, so
  // the next positive-tabIndex stop is the first project book (tabIndex=100).
  // Walk the stack in numerical tabIndex order; this list mirrors
  // src/content/projects/index.ts.
  const expectedBookIds = [
    'atelier',
    'synapse-oms',
    'sentinel',
    'aurora-ui',
  ] as const;
  for (const id of expectedBookIds) {
    await page.keyboard.press('Tab');
    const focused = await focusedTestId(page);
    expect(focused).toBe(`project-book-${id}`);
  }

  // Sanity: stack visibly renders exactly the projects in index.ts (up to the
  // MAX_BOOKS cap in src/scene/project-books/stack-config.ts — currently 8).
  const stackCount = await page.getByTestId(/^project-book-/).count();
  // +1 for the invisible `project-book-stack` sentinel <div>.
  expect(stackCount).toBe(expectedBookIds.length + 1);
});
