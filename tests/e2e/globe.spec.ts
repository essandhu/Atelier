import { expect, test } from '@playwright/test';
import { dismissIntro } from './fixtures/dismiss-intro';

test.beforeEach(async ({ page }) => {
  await dismissIntro(page);
});

test.describe('globe interaction', () => {
  test('focus → Enter opens the location panel', async ({ page }) => {
    await page.goto('/?time=evening');
    await expect(page.getByTestId('scene-canvas')).toBeAttached({
      timeout: 15_000,
    });
    const hotspot = page.getByTestId('globe-hotspot');
    await expect(hotspot).toBeAttached({ timeout: 15_000 });

    await hotspot.focus();
    await page.keyboard.press('Enter');

    const panel = page.getByTestId('globe-panel');
    await expect(panel).toBeVisible({ timeout: 3000 });
    await expect(panel).toContainText(/currently based in/i);
    await expect(panel).toContainText(/texas/i);
  });

  test('opening the panel fires panel.opened telemetry', async ({ page }) => {
    await page.goto('/?time=evening');
    await expect(page.getByTestId('scene-canvas')).toBeAttached({
      timeout: 15_000,
    });
    const hotspot = page.getByTestId('globe-hotspot');
    await expect(hotspot).toBeAttached({ timeout: 15_000 });

    await hotspot.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('globe-panel')).toBeVisible({
      timeout: 3000,
    });

    const events = await page.evaluate(
      () =>
        ((window as unknown as { dataLayer?: unknown[] }).dataLayer ?? []) as Array<{
          name: string;
          panelId?: string;
        }>,
    );
    expect(events).toContainEqual(
      expect.objectContaining({ name: 'panel.opened', panelId: 'globe' }),
    );
  });

  test('mouse click on the globe opens the location panel', async ({
    page,
  }) => {
    await page.goto('/?time=evening');
    await expect(page.getByTestId('scene-canvas')).toBeAttached({
      timeout: 15_000,
    });
    const hotspot = page.getByTestId('globe-hotspot');
    await expect(hotspot).toBeAttached({ timeout: 15_000 });

    // Click at the hotspot's centre — exercises browser-native click
    // classification (pointerdown + pointerup at same coords). Before the
    // dedicated `onClick` handler was added, click-to-open was tied to
    // `onPointerUp`'s 2px-jitter heuristic, which routed casual clicks
    // into the momentum branch (no panel open).
    await hotspot.click();

    const panel = page.getByTestId('globe-panel');
    await expect(panel).toBeVisible({ timeout: 3000 });
    await expect(panel).toContainText(/currently based in/i);
  });

  test('reduced motion disables idle rotation', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();
    await dismissIntro(page);
    await page.goto('/?time=evening');
    await expect(page.getByTestId('scene-canvas')).toBeAttached({
      timeout: 15_000,
    });
    const hotspot = page.getByTestId('globe-hotspot');
    await expect(hotspot).toBeAttached({ timeout: 15_000 });

    await expect(hotspot).toHaveAttribute('data-reduced-motion', 'true');
    await page.waitForTimeout(1500);
    const rotation = await hotspot.getAttribute('data-globe-rotation');
    // Under reduced motion, residual idle velocity should settle to zero
    // quickly; rotation remains near its seeded value.
    expect(Math.abs(Number(rotation ?? '0'))).toBeLessThan(0.02);
    await context.close();
  });
});
