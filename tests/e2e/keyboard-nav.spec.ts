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

test('After dismissing intro, Tab walks skip → hero book → project books in TAB_ORDER sequence', async ({
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

  // With the intro dismissed, intro-begin and webcam-toggle are unmounted.
  // Next positive-tabIndex stop is the HeroBook at TAB_ORDER.liveActivityBook
  // (= 10), which represents Atelier at the desk centre (P10-09).
  await page.keyboard.press('Tab');
  expect(await focusedTestId(page)).toBe('hero-book');

  // Then the remaining project books in the stack, in src/content/projects
  // manifest order minus the hero (Atelier lives exclusively on the HeroBook).
  const expectedBookIds = ['synapse-oms', 'sentinel', 'aurora-ui'] as const;
  for (const id of expectedBookIds) {
    await page.keyboard.press('Tab');
    const focused = await focusedTestId(page);
    expect(focused).toBe(`project-book-${id}`);
  }

  // Sanity: stack renders exactly the non-hero projects plus the invisible
  // `project-book-stack` sentinel <div>.
  const stackCount = await page.getByTestId(/^project-book-/).count();
  expect(stackCount).toBe(expectedBookIds.length + 1);
});

test('Tab continues hero → project books → skills-catalog → globe → events hotspot', async ({
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
  await expect(page.getByTestId('live-activity-hotspot')).toBeAttached({
    timeout: 15_000,
  });

  await resetFocusToBody(page);

  // Skip → hero-book (10) → 3 project books (100..102) → skills-catalog (150)
  // → globe (160) → events-feed hotspot (200).
  await page.keyboard.press('Tab');
  expect(await focusedTestId(page)).toBe('skip-to-fallback');
  await page.keyboard.press('Tab');
  expect(await focusedTestId(page)).toBe('hero-book');
  for (const id of ['synapse-oms', 'sentinel', 'aurora-ui']) {
    await page.keyboard.press('Tab');
    expect(await focusedTestId(page)).toBe(`project-book-${id}`);
  }
  await page.keyboard.press('Tab');
  expect(await focusedTestId(page)).toBe('skills-catalog-hotspot');
  await page.keyboard.press('Tab');
  expect(await focusedTestId(page)).toBe('globe-hotspot');
  await page.keyboard.press('Tab');
  expect(await focusedTestId(page)).toBe('live-activity-hotspot');
});

test('Focus restoration — hero-book panel Escape returns focus to the hero hotspot', async ({
  page,
}) => {
  await dismissIntro(page);
  await page.goto('/?time=evening');
  await expect(page.getByTestId('scene-canvas').locator('canvas')).toBeAttached(
    { timeout: 15_000 },
  );
  await expect(page.getByTestId('hero-book')).toBeAttached({
    timeout: 15_000,
  });

  await resetFocusToBody(page);
  // Tab to the hero book (first positive-tabIndex stop after the skip link).
  await page.keyboard.press('Tab'); // skip
  await page.keyboard.press('Tab'); // hero = atelier
  expect(await focusedTestId(page)).toBe('hero-book');

  await page.keyboard.press('Enter');
  await expect(page.getByTestId('project-panel-atelier')).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(page.getByTestId('project-panel-atelier')).not.toBeVisible();

  // HeroBook restores focus on `phase === 'closed'` via anchorRef.focus().
  await expect.poll(() => focusedTestId(page)).toBe('hero-book');
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

test('Focus restoration — events panel Escape returns focus to live-activity hotspot', async ({
  page,
}) => {
  await dismissIntro(page);
  await page.goto('/?time=evening');
  await expect(page.getByTestId('scene-canvas').locator('canvas')).toBeAttached(
    { timeout: 15_000 },
  );
  await expect(page.getByTestId('live-activity-hotspot')).toBeAttached({
    timeout: 15_000,
  });

  await page.getByTestId('live-activity-hotspot').focus();
  expect(await focusedTestId(page)).toBe('live-activity-hotspot');

  await page.keyboard.press('Enter');
  await expect(page.getByTestId('events-feed-panel')).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(page.getByTestId('events-feed-panel')).not.toBeVisible();

  await expect
    .poll(() => focusedTestId(page))
    .toBe('live-activity-hotspot');
});

test('Focus-visible renders a visible outline on the focused scene anchor', async ({
  page,
}) => {
  await dismissIntro(page);
  await page.goto('/?time=evening');
  await expect(page.getByTestId('scene-canvas').locator('canvas')).toBeAttached(
    { timeout: 15_000 },
  );
  await expect(page.getByTestId('hero-book')).toBeAttached({
    timeout: 15_000,
  });

  await resetFocusToBody(page);
  // Keyboard-Tab triggers :focus-visible; pointer/script focus does not.
  await page.keyboard.press('Tab'); // skip
  await page.keyboard.press('Tab'); // hero-book (first scene stop)
  expect(await focusedTestId(page)).toBe('hero-book');

  // `.scene-focus-ring:focus-visible` renders `outline: 2px solid var(--accent)`
  // *on a visible element*. The original Phase-9 assertion checked only
  // outline-width, which computes correctly even when the element has
  // `opacity: 0` inline (and therefore paints nothing). Assert all three
  // properties so a future regression to the inline opacity:0 vs.
  // stylesheet opacity:1 cascade can't slip through.
  const visible = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el) return null;
    const cs = getComputedStyle(el);
    return {
      outlineWidthPx: parseFloat(cs.outlineWidth) || 0,
      outlineStyle: cs.outlineStyle,
      opacity: cs.opacity,
    };
  });
  expect(visible).not.toBeNull();
  expect(visible!.outlineWidthPx).toBeGreaterThanOrEqual(1);
  expect(visible!.outlineStyle).not.toBe('none');
  // opacity must be exactly '1' so the ring actually paints. Inline
  // `style={{ opacity: 0 }}` on the anchor would defeat the rule without the
  // `!important` markers in `.scene-focus-ring:focus-visible`.
  expect(visible!.opacity).toBe('1');
});
