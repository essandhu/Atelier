import { expect, test, type Page } from '@playwright/test';
import { dismissIntro } from './fixtures/dismiss-intro';

/**
 * P10-19 — camera-dock flows.
 *
 * Covers the keyboard + preference paths documented in §5.5 / §11.6:
 *   1. Enter on a dockable hotspot → dock → panel body → close (reduced-motion
 *      variant runs the single-frame snap; the full-spring variant carries a
 *      wide timeout because Playwright-headless Chromium only drives R3F's
 *      `useFrame` at ~1–2 fps under SwiftShader, so the critically-damped
 *      dock spring can take 10–20 s of wall-clock to reach ε-settle even
 *      though τ = 200 ms — see `Deviations` in P10-19 notes).
 *   2. Shift+Enter on a dockable hotspot → forces `presentationMode = panel`
 *      so the 2D `PanelFrame` owns the body. The camera still paths through
 *      `docking → docked → opening` (the store phase machine is independent
 *      of the presentation form), but the DOM surface is the 2D panel.
 *   3. `V` while a panel is live toggles `presentationMode` across the
 *      `auto → diegetic → panel → auto` cycle.
 *   4. Reduced-motion short-circuits the dock and routes to the 2D panel in
 *      one frame (matches §11.5).
 */

test.beforeEach(async ({ page }) => {
  await dismissIntro(page);
});

// Reading the scene-store phase directly via the dev-only `__atelier` debug
// hook (Scene.tsx) is the one reliable way to poll the phase machine without
// racing the R3F render tick — hence all gates use it instead of DOM attr
// probes. The hook ships only in `NODE_ENV !== 'production'`, which is how
// the Playwright dev server runs.
const readScenePhase = (page: Page): Promise<string> =>
  page.evaluate(() => {
    const w = window as unknown as {
      __atelier?: { scenePhase?: () => string };
    };
    return w.__atelier?.scenePhase?.() ?? 'no-hook';
  });

const readPresentationMode = (page: Page): Promise<string> =>
  page.evaluate(() => {
    const w = window as unknown as {
      __atelier?: { presentationMode?: () => string };
    };
    return w.__atelier?.presentationMode?.() ?? 'no-hook';
  });

const focusedTestId = (page: Page): Promise<string | null> =>
  page.evaluate(
    () =>
      (document.activeElement as HTMLElement | null)?.getAttribute(
        'data-testid',
      ) ?? null,
  );

// Headless SwiftShader rendering is the rate-limiter here — the spring's
// pure-math settle is <1 s, but useFrame only ticks at ~1 fps in CI.
const DOCK_SETTLE_TIMEOUT = 45_000;

test.describe('camera-dock — reduced motion (single-frame snap)', () => {
  test('HeroBook: Enter under reducedMotion mounts the 2D ProjectPanel immediately', async ({
    browser,
  }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();
    await dismissIntro(page);
    await page.goto('/?time=evening');
    await expect(page.getByTestId('scene-canvas')).toBeAttached({
      timeout: 15_000,
    });
    const hotspot = page.getByTestId('hero-book');
    await expect(hotspot).toBeAttached({ timeout: 15_000 });

    await hotspot.focus();
    await page.keyboard.press('Enter');

    // §11.5: reduced-motion → 2D panel path, one-frame snap through docking.
    const frame = page.getByTestId('panel-frame');
    await expect(frame).toBeVisible({ timeout: 10_000 });
    await expect(frame).toHaveAttribute('data-reduced-motion', 'true');
    await expect(page.getByTestId('project-panel-atelier')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(frame).toBeHidden({ timeout: 5000 });
    await context.close();
  });

  test('ContactCard: Enter under reducedMotion mounts the 2D ContactPanel immediately', async ({
    browser,
  }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();
    await dismissIntro(page);
    await page.goto('/?time=evening');
    await expect(page.getByTestId('scene-canvas')).toBeAttached({
      timeout: 15_000,
    });
    const card = page.getByTestId('contact-card');
    await expect(card).toBeAttached({ timeout: 15_000 });

    await card.focus();
    await page.keyboard.press('Enter');

    const frame = page.getByTestId('panel-frame');
    await expect(frame).toBeVisible({ timeout: 10_000 });
    await expect(frame).toHaveAttribute('data-reduced-motion', 'true');
    await expect(page.getByTestId('contact-panel')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(frame).toBeHidden({ timeout: 5000 });
    await expect.poll(() => focusedTestId(page)).toBe('contact-card');
    await context.close();
  });
});

test.describe('camera-dock — full-spring flow', () => {
  test('HeroBook: dock → on-object surface → close, scene phase progresses docking → open → closed', async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await page.goto('/?time=evening');
    await expect(page.getByTestId('scene-canvas')).toBeAttached({
      timeout: 15_000,
    });
    const hotspot = page.getByTestId('hero-book');
    await expect(hotspot).toBeAttached({ timeout: 15_000 });

    await hotspot.focus();
    await page.keyboard.press('Enter');

    // §4.3 dockable path: closed → docking.
    await expect
      .poll(() => readScenePhase(page), { timeout: 5000 })
      .toBe('docking');

    // Spring settles → settleDock + startOpening → useDockPhaseTimers →
    // markOpened → phase = 'open'.
    await expect
      .poll(() => readScenePhase(page), { timeout: DOCK_SETTLE_TIMEOUT })
      .toBe('open');

    // Diegetic body mounts via `<Html transform>` on `heroBook:page`. The
    // ProjectPanel body is the same DOM used by the 2D path, so asserting
    // its testid proves the on-object surface reached the docked state.
    await expect(page.getByTestId('project-panel-atelier')).toBeAttached({
      timeout: 5000,
    });

    await page.keyboard.press('Escape');

    // closing → closed; focus restored to the hero hotspot.
    await expect
      .poll(() => readScenePhase(page), { timeout: DOCK_SETTLE_TIMEOUT })
      .toBe('closed');
    await expect.poll(() => focusedTestId(page)).toBe('hero-book');
  });

  test('ContactCard: dock → on-object surface → close, scene phase progresses docking → open → closed', async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await page.goto('/?time=evening');
    await expect(page.getByTestId('scene-canvas')).toBeAttached({
      timeout: 15_000,
    });
    const card = page.getByTestId('contact-card');
    await expect(card).toBeAttached({ timeout: 15_000 });

    await card.focus();
    await page.keyboard.press('Enter');

    await expect
      .poll(() => readScenePhase(page), { timeout: 5000 })
      .toBe('docking');
    await expect
      .poll(() => readScenePhase(page), { timeout: DOCK_SETTLE_TIMEOUT })
      .toBe('open');

    await expect(page.getByTestId('contact-panel')).toBeAttached({
      timeout: 5000,
    });

    await page.keyboard.press('Escape');
    await expect
      .poll(() => readScenePhase(page), { timeout: DOCK_SETTLE_TIMEOUT })
      .toBe('closed');
    await expect.poll(() => focusedTestId(page)).toBe('contact-card');
  });
});

test.describe('camera-dock — keyboard overrides', () => {
  test('Shift+Enter on a dockable hotspot forces presentationMode=panel', async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await page.goto('/?time=evening');
    await expect(page.getByTestId('scene-canvas')).toBeAttached({
      timeout: 15_000,
    });
    const hotspot = page.getByTestId('hero-book');
    await expect(hotspot).toBeAttached({ timeout: 15_000 });

    // Precondition: default mode is 'auto'.
    await expect
      .poll(() => readPresentationMode(page), { timeout: 5000 })
      .toBe('auto');

    await hotspot.focus();
    await page.keyboard.press('Shift+Enter');

    // `dockableFromFocus()` reads `data-dockable`/`data-panel-kind` off the
    // focused element; on match it flips `presentationMode` to 'panel'
    // synchronously before dispatching `open()`. The mode assertion proves
    // the Shift+Enter branch ran (not the plain-Enter fallthrough).
    await expect
      .poll(() => readPresentationMode(page), { timeout: 5000 })
      .toBe('panel');

    // Close — keyboard handler's `armRevertOnClose` restores 'auto' so the
    // next panel follows the default branch.
    await page.keyboard.press('Escape');
    await expect
      .poll(() => readPresentationMode(page), { timeout: DOCK_SETTLE_TIMEOUT })
      .toBe('auto');
  });

  test('V while a panel is live cycles presentationMode auto → diegetic → panel → auto', async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await page.goto('/?time=evening');
    await expect(page.getByTestId('scene-canvas')).toBeAttached({
      timeout: 15_000,
    });
    const hotspot = page.getByTestId('hero-book');
    await expect(hotspot).toBeAttached({ timeout: 15_000 });

    await hotspot.focus();
    await page.keyboard.press('Enter');

    // V handler no-ops on phase ∈ {closed, closing}, so wait for docking.
    await expect
      .poll(() => readScenePhase(page), { timeout: 5000 })
      .toBe('docking');

    // auto → diegetic.
    await page.keyboard.press('v');
    await expect
      .poll(() => readPresentationMode(page), { timeout: 2000 })
      .toBe('diegetic');

    // diegetic → panel.
    await page.keyboard.press('v');
    await expect
      .poll(() => readPresentationMode(page), { timeout: 2000 })
      .toBe('panel');

    // panel → auto, completing the cycle.
    await page.keyboard.press('v');
    await expect
      .poll(() => readPresentationMode(page), { timeout: 2000 })
      .toBe('auto');

    await page.keyboard.press('Escape');
    // Let the store drain to avoid spilling state into later specs.
    await expect
      .poll(() => readScenePhase(page), { timeout: DOCK_SETTLE_TIMEOUT })
      .toBe('closed');
  });
});
