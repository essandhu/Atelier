/**
 * Mobile DeviceOrientation opt-in flow (P10-00g).
 *
 * Runs under the `mobile-chrome` project (Pixel 5 emulation) and is gated
 * behind `ATELIER_MOBILE_E2E=1`, same pattern as ATELIER_PERF_HARDGATE.
 * Unit tests (`tests/unit/device-orientation.test.ts`) already cover the
 * pure tilt → offset math; this spec covers the browser-integration path:
 *
 *   1. DeviceOrientationToggle renders when the viewport is narrow (≤ 480 px).
 *   2. Clicking it flips prefsStore.deviceOrientationOptIn and mounts
 *      <DeviceOrientationListener />.
 *   3. A synthesised `deviceorientation` event seeds the baseline on the
 *      first sample (no offset) and writes a non-zero parallax offset on
 *      the second sample.
 *
 * Why two dispatches: the listener records the first event as its baseline
 * and returns early; subsequent events subtract baseline before writing.
 *
 * Why no `dismissIntro`: the toggle is rendered INSIDE the IntroOverlay
 * (alongside WebcamToggle on narrow viewports). Dismissing the intro would
 * unmount it.
 */
import { expect, test } from '@playwright/test';

const ENABLED = process.env.ATELIER_MOBILE_E2E === '1';

test.describe('mobile device orientation', () => {
  test.skip(
    !ENABLED,
    'mobile e2e disabled — set ATELIER_MOBILE_E2E=1 to enforce',
  );

  test('toggle + synthetic tilt writes non-zero parallax offset', async ({
    page,
    context,
  }) => {
    // Best-effort grant — Chromium mobile emulation already lets synthetic
    // DeviceOrientationEvent dispatch through without an iOS-style
    // `requestPermission` prompt (the emulated `DeviceOrientationEvent`
    // constructor has no `requestPermission` static), but other engines or
    // future Playwright versions may gate on this.
    try {
      await context.grantPermissions(['accelerometer', 'gyroscope']);
    } catch {
      // Older Playwright / other browsers may reject these names — safe to
      // ignore, the test only depends on the dispatched event path.
    }

    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/');
    await expect(page.getByTestId('scene-canvas')).toBeAttached({
      timeout: 15_000,
    });

    const toggle = page.getByTestId('device-orientation-toggle');
    await expect(toggle).toBeVisible({ timeout: 10_000 });
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true', {
      timeout: 5_000,
    });

    // First dispatch seeds the baseline (no offset written).
    await page.evaluate(() => {
      window.dispatchEvent(
        new DeviceOrientationEvent('deviceorientation', {
          alpha: 0,
          beta: 0,
          gamma: 0,
          absolute: true,
        }),
      );
    });

    // Second dispatch writes a non-zero offset (dBeta = 10, dGamma = 5 after
    // baseline subtraction — both inside the clamp band so the math in
    // `tiltToOffset` scales them linearly).
    await page.evaluate(() => {
      window.dispatchEvent(
        new DeviceOrientationEvent('deviceorientation', {
          alpha: 0,
          beta: 10,
          gamma: 5,
          absolute: true,
        }),
      );
    });

    const offset = await page.evaluate(() => {
      const w = window as unknown as {
        __atelier?: {
          parallaxOffset: () => { x: number; y: number; z: number };
        };
      };
      return w.__atelier?.parallaxOffset() ?? null;
    });
    expect(offset).not.toBeNull();
    // X_GAIN = 0.005 × dGamma 5 = 0.025; Y_GAIN = 0.005 × dBeta 10 = 0.05.
    // Assert non-zero rather than exact so this spec stays coupled only to
    // "did the event → store path fire" and not to the tuning constants
    // (covered by the unit test).
    expect(Math.abs(offset!.x) + Math.abs(offset!.y)).toBeGreaterThan(0);
  });
});
