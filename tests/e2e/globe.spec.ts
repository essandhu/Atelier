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

  test('pointer drag fires globe.spun telemetry with durationMs > 0', async ({
    page,
  }) => {
    await page.goto('/?time=evening');
    await expect(page.getByTestId('scene-canvas')).toBeAttached({
      timeout: 15_000,
    });
    const hotspot = page.getByTestId('globe-hotspot');
    await expect(hotspot).toBeAttached({ timeout: 15_000 });

    // The hotspot is a 1×1 focus anchor at the centre of the 240×240 drag
    // pad. Dragging from its centre 80 px to the right qualifies as a drag
    // (> CLICK_THRESHOLD_PX of 5), which routes through the momentum branch
    // in Globe's `onPointerUp` and emits `globe.spun`. The hotspot position
    // tracks GLOBE_POSITION [-0.65, 0.86, 0.25] from P10-14 (front-left) via
    // drei <Html> portaling — no camera-projection math needed.
    const box = await hotspot.boundingBox();
    expect(box).not.toBeNull();
    const cx = box!.x + box!.width / 2;
    const cy = box!.y + box!.height / 2;

    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx + 80, cy);
    await page.mouse.up();

    const events = await page.evaluate(
      () =>
        ((window as unknown as { dataLayer?: unknown[] }).dataLayer ?? []) as Array<{
          name: string;
          durationMs?: number;
          totalRadians?: number;
        }>,
    );
    const spun = events.find((e) => e.name === 'globe.spun');
    expect(spun).toBeDefined();
    expect(spun!.durationMs).toBeGreaterThan(0);
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
