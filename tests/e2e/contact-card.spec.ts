import { expect, test, type Page } from '@playwright/test';
import { dismissIntro } from './fixtures/dismiss-intro';

/**
 * P10-19 — ContactCard dockable flow.
 *
 * Covers the keyboard path from §11.6 for the `{ kind: 'contact' }` panel:
 *   Tab → contact-card hotspot → Enter → panel visible → Escape → focus
 *   restored to the card.
 *
 * Also exercises the §5.5 reduced-motion short-circuit: the 2D ContactPanel
 * mounts in a single frame when the visitor prefers reduced motion.
 *
 * Runtime note: under Playwright-headless Chromium + SwiftShader the R3F
 * `useFrame` ticks at ~1–2 fps, so the camera-dock spring takes ~10–15 s to
 * reach ε-settle. The full-spring smoke below carries a 90 s test timeout to
 * absorb that — most of the scene-store phase-machine assertions here use
 * `reducedMotion: 'reduce'` to keep the suite fast and deterministic.
 */

test.beforeEach(async ({ page }) => {
  await dismissIntro(page);
});

const focusedTestId = (page: Page): Promise<string | null> =>
  page.evaluate(
    () =>
      (document.activeElement as HTMLElement | null)?.getAttribute(
        'data-testid',
      ) ?? null,
  );

const readScenePhase = (page: Page): Promise<string> =>
  page.evaluate(() => {
    const w = window as unknown as {
      __atelier?: { scenePhase?: () => string };
    };
    return w.__atelier?.scenePhase?.() ?? 'no-hook';
  });

const DOCK_SETTLE_TIMEOUT = 30_000;

const MAX_TABS = 25;

const tabUntil = async (page: Page, testId: string): Promise<void> => {
  for (let i = 0; i < MAX_TABS; i++) {
    const focused = await focusedTestId(page);
    if (focused === testId) return;
    await page.keyboard.press('Tab');
  }
  throw new Error(
    `Failed to tab to [data-testid="${testId}"] within ${MAX_TABS} presses`,
  );
};

test.describe('contact card — reduced motion fallback (fast path)', () => {
  test('Tab → Enter opens 2D ContactPanel, Escape restores focus', async ({
    browser,
  }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();
    await dismissIntro(page);
    await page.goto('/?time=evening');
    await expect(page.getByTestId('scene-canvas')).toBeAttached({
      timeout: 15_000,
    });
    await expect(page.getByTestId('contact-card')).toBeAttached({
      timeout: 15_000,
    });

    await page.evaluate(() => document.body.focus());
    await tabUntil(page, 'contact-card');
    expect(await focusedTestId(page)).toBe('contact-card');

    await page.keyboard.press('Enter');

    const panel = page.getByTestId('contact-panel');
    await expect(panel).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('panel-frame')).toHaveAttribute(
      'data-reduced-motion',
      'true',
    );

    await page.keyboard.press('Escape');
    await expect(panel).not.toBeVisible({ timeout: 3000 });

    // Focus restoration — ContactCard's focus-restoration effect returns
    // focus to the hotspot on phase → closed.
    await expect.poll(() => focusedTestId(page)).toBe('contact-card');
    await context.close();
  });

  test('opening the contact panel fires panel.opened telemetry', async ({
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

    await expect(page.getByTestId('contact-panel')).toBeVisible({
      timeout: 5000,
    });

    const events = await page.evaluate(
      () =>
        ((window as unknown as { dataLayer?: unknown[] }).dataLayer ??
          []) as Array<{
          name: string;
          panelId?: string;
        }>,
    );
    expect(events).toContainEqual(
      expect.objectContaining({ name: 'panel.opened', panelId: 'contact' }),
    );
    await context.close();
  });
});

test.describe('contact card — full-spring flow', () => {
  test('Tab → Enter → dock → on-object surface → Escape restores focus', async ({
    page,
  }) => {
    test.setTimeout(90_000);
    await page.goto('/?time=evening');
    await expect(page.getByTestId('scene-canvas')).toBeAttached({
      timeout: 15_000,
    });
    await expect(page.getByTestId('contact-card')).toBeAttached({
      timeout: 15_000,
    });

    await page.evaluate(() => document.body.focus());
    await tabUntil(page, 'contact-card');
    expect(await focusedTestId(page)).toBe('contact-card');

    await page.keyboard.press('Enter');

    await expect
      .poll(() => readScenePhase(page), { timeout: 5000 })
      .toBe('docking');
    await expect
      .poll(() => readScenePhase(page), { timeout: DOCK_SETTLE_TIMEOUT })
      .toBe('open');

    // Diegetic body surfaces on `contactCard:face` — same ContactPanel
    // body DOM, same testid, different mount site.
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
