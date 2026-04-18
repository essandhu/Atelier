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

test('Tab continues through project books → skills-catalog → globe', async ({
  page,
}) => {
  await dismissIntro(page);
  await page.goto('/?time=evening');
  await expect(page.getByTestId('scene-canvas').locator('canvas')).toBeAttached(
    { timeout: 15_000 },
  );
  await expect(page.getByTestId('skills-catalog-hotspot')).toBeAttached({
    timeout: 15_000,
  });
  await expect(page.getByTestId('globe-hotspot')).toBeAttached({
    timeout: 15_000,
  });

  await resetFocusToBody(page);

  // Skip → 4 project books (100..103) → skills-catalog (150) → globe (160).
  await page.keyboard.press('Tab');
  expect(await focusedTestId(page)).toBe('skip-to-fallback');
  for (const id of ['atelier', 'synapse-oms', 'sentinel', 'aurora-ui']) {
    await page.keyboard.press('Tab');
    expect(await focusedTestId(page)).toBe(`project-book-${id}`);
  }
  await page.keyboard.press('Tab');
  expect(await focusedTestId(page)).toBe('skills-catalog-hotspot');
  await page.keyboard.press('Tab');
  expect(await focusedTestId(page)).toBe('globe-hotspot');
});

test('Focus restoration — project panel Escape returns focus to book', async ({
  page,
}) => {
  await dismissIntro(page);
  await page.goto('/?time=evening');
  await expect(page.getByTestId('scene-canvas').locator('canvas')).toBeAttached(
    { timeout: 15_000 },
  );
  await expect(page.getByTestId('project-book-atelier')).toBeAttached({
    timeout: 15_000,
  });

  await resetFocusToBody(page);
  // Tab to the first book.
  await page.keyboard.press('Tab'); // skip
  await page.keyboard.press('Tab'); // book 0 = atelier
  expect(await focusedTestId(page)).toBe('project-book-atelier');

  await page.keyboard.press('Enter');
  await expect(page.getByTestId('project-panel-atelier')).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(page.getByTestId('project-panel-atelier')).not.toBeVisible();

  // ProjectBook.tsx restores focus on `phase === 'closed'` via anchorRef.focus().
  await expect
    .poll(() => focusedTestId(page))
    .toBe('project-book-atelier');
});

test('Focus restoration — skills panel Escape returns focus to catalog hotspot', async ({
  page,
}) => {
  await dismissIntro(page);
  await page.goto('/?time=evening');
  await expect(page.getByTestId('scene-canvas').locator('canvas')).toBeAttached(
    { timeout: 15_000 },
  );
  await expect(page.getByTestId('skills-catalog-hotspot')).toBeAttached({
    timeout: 15_000,
  });

  await page.getByTestId('skills-catalog-hotspot').focus();
  expect(await focusedTestId(page)).toBe('skills-catalog-hotspot');

  await page.keyboard.press('Enter');
  await expect(page.getByTestId('skills-catalog-panel')).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(page.getByTestId('skills-catalog-panel')).not.toBeVisible();

  // Radix Dialog restores focus to the opener on close; opener was the
  // skills-catalog hotspot.
  await expect
    .poll(() => focusedTestId(page))
    .toBe('skills-catalog-hotspot');
});

test('Focus restoration — globe panel Escape returns focus to globe hotspot', async ({
  page,
}) => {
  await dismissIntro(page);
  await page.goto('/?time=evening');
  await expect(page.getByTestId('scene-canvas').locator('canvas')).toBeAttached(
    { timeout: 15_000 },
  );
  await expect(page.getByTestId('globe-hotspot')).toBeAttached({
    timeout: 15_000,
  });

  await page.getByTestId('globe-hotspot').focus();
  expect(await focusedTestId(page)).toBe('globe-hotspot');

  await page.keyboard.press('Enter');
  await expect(page.getByTestId('globe-panel')).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(page.getByTestId('globe-panel')).not.toBeVisible();

  await expect
    .poll(() => focusedTestId(page))
    .toBe('globe-hotspot');
});

test('Focus-visible renders a visible outline on the focused scene anchor', async ({
  page,
}) => {
  await dismissIntro(page);
  await page.goto('/?time=evening');
  await expect(page.getByTestId('scene-canvas').locator('canvas')).toBeAttached(
    { timeout: 15_000 },
  );
  await expect(page.getByTestId('project-book-atelier')).toBeAttached({
    timeout: 15_000,
  });

  await resetFocusToBody(page);
  // Keyboard-Tab triggers :focus-visible; pointer/script focus does not.
  await page.keyboard.press('Tab'); // skip
  await page.keyboard.press('Tab'); // first book
  expect(await focusedTestId(page)).toBe('project-book-atelier');

  // `.scene-focus-ring:focus-visible` renders `outline: 2px solid var(--accent)`.
  // The computed outline-width is reported as a px value ≥ 1 when the ring is
  // visible; resilient to accent-color variations per time-of-day state.
  const outlineWidthPx = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el) return 0;
    const cs = getComputedStyle(el);
    const raw = cs.outlineWidth;
    const parsed = parseFloat(raw);
    return Number.isFinite(parsed) ? parsed : 0;
  });
  expect(outlineWidthPx).toBeGreaterThanOrEqual(1);
});
