import { expect, test } from '@playwright/test';
import { dismissIntro } from './fixtures/dismiss-intro';
import { TAB_ORDER } from '../../src/interaction/tab-order';

const STATES = ['morning', 'day', 'evening', 'night'] as const;

test.describe('background (Phase 7)', () => {
  test.beforeEach(async ({ page }) => {
    await dismissIntro(page);
  });

  test('bookshelf + wall piece anchors render after scene load', async ({
    page,
  }) => {
    await page.goto('/?time=evening');
    await expect(
      page.getByTestId('scene-canvas').locator('canvas'),
    ).toBeAttached({ timeout: 15_000 });

    await expect(page.getByTestId('bookshelf-anchor')).toBeAttached();
    await expect(page.getByTestId('wall-piece-anchor')).toBeAttached();
  });

  test('background anchors are not in the focus path', async ({ page }) => {
    // Each Tab press triggers a full page.evaluate roundtrip; combined with a
    // 60fps WebGL canvas on the main thread, a 10-step walk can brush the
    // default 30s budget. 60s keeps ample headroom while staying well inside
    // the suite's overall run time.
    test.setTimeout(60_000);

    await page.goto('/?time=evening');
    await expect(
      page.getByTestId('scene-canvas').locator('canvas'),
    ).toBeAttached({ timeout: 15_000 });

    await page.evaluate(() => {
      (document.activeElement as HTMLElement | null)?.blur?.();
      document.body.focus();
    });

    const steps = Object.values(TAB_ORDER).length + 2;
    for (let i = 0; i < steps; i++) {
      await page.keyboard.press('Tab');
      const focusedTestId = await page.evaluate(
        () =>
          (document.activeElement as HTMLElement | null)?.getAttribute(
            'data-testid',
          ) ?? null,
      );
      expect(focusedTestId).not.toBe('bookshelf-anchor');
      expect(focusedTestId).not.toBe('wall-piece-anchor');
    }
  });

  test('per-state smoke — background renders for every ?time= override', async ({
    page,
  }) => {
    for (const state of STATES) {
      await page.goto(`/?time=${state}`);
      await expect(
        page.getByTestId('scene-canvas').locator('canvas'),
      ).toBeAttached({ timeout: 15_000 });

      const resolved = page.locator(
        `[data-testid="resolved-state"][data-state="${state}"]`,
      );
      await expect(resolved).toBeAttached({ timeout: 10_000 });

      await expect(page.getByTestId('bookshelf-anchor')).toBeAttached();
      await expect(page.getByTestId('wall-piece-anchor')).toBeAttached();
    }
  });
});

