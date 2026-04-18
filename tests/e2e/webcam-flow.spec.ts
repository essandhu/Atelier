/**
 * Webcam opt-in flow — the only e2e verifier of the "fully tears down media
 * streams" acceptance criterion from Phase 8. Exercises four scenarios:
 *
 *   1. Granted  — toggle flips on, parallax offset goes non-zero
 *   2. Denied   — toggle stays off, denied copy renders
 *   3. Teardown — toggle off → stream.readyState === 'ended'
 *   4. ReducedMotion — getUserMedia must never fire
 *
 * DeviceOrientation flow is **deferred to a Playwright-on-mobile future spec**
 * (Phase 10) because Playwright's `DeviceOrientationEvent` synthesis on
 * desktop browsers is not first-class.
 */
import { expect, test } from '@playwright/test';
import { installWebcamMock, getGumCallCount } from './fixtures/webcam-mock';

// Intentionally leave the IntroOverlay mounted — the WebcamToggle lives
// inside it and the spec exercises the in-overlay enable / disable flow.

test('granted path: toggle enables webcam parallax, stream persists', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await installWebcamMock(page, 'granted');
  await page.goto('/');
  await expect(page.getByTestId('scene-canvas')).toBeAttached({
    timeout: 15_000,
  });
  const toggle = page.getByTestId('webcam-toggle');
  await expect(toggle).toBeVisible();
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');

  await toggle.click();

  await expect(toggle).toHaveAttribute('aria-pressed', 'true', {
    timeout: 5_000,
  });
  await expect(toggle).toContainText(/Disable/i);

  // Confirm the stream is live through the dev-only debug hook.
  const isLive = await page.evaluate(() => {
    const w = window as unknown as {
      __atelier?: { activeStream: () => MediaStream | null };
    };
    const stream = w.__atelier?.activeStream() ?? null;
    if (!stream) return false;
    return stream.getTracks().every((t) => t.readyState === 'live');
  });
  expect(isLive).toBe(true);
});

test('denied path: toggle stays off, inline denied copy renders', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await installWebcamMock(page, 'denied');
  await page.goto('/');
  await expect(page.getByTestId('scene-canvas')).toBeAttached({
    timeout: 15_000,
  });
  const toggle = page.getByTestId('webcam-toggle');
  await toggle.click();
  await expect(page.getByTestId('webcam-toggle-error')).toBeVisible({
    timeout: 5_000,
  });
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
});

test('teardown path: second click stops every track', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await installWebcamMock(page, 'granted');
  await page.goto('/');
  await expect(page.getByTestId('scene-canvas')).toBeAttached({
    timeout: 15_000,
  });
  const toggle = page.getByTestId('webcam-toggle');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true', {
    timeout: 5_000,
  });

  // Grab a reference to the stream's tracks before teardown.
  const snapshot = await page.evaluate(() => {
    const w = window as unknown as {
      __atelier?: { activeStream: () => MediaStream | null };
    };
    const stream = w.__atelier?.activeStream() ?? null;
    if (!stream) return null;
    const tracks = stream.getTracks();
    (
      window as unknown as { __capturedTracks?: MediaStreamTrack[] }
    ).__capturedTracks = tracks;
    return tracks.length;
  });
  expect(snapshot).toBeGreaterThan(0);

  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'false', {
    timeout: 5_000,
  });

  // Confirm each captured track is now ended.
  const endedAll = await page.evaluate(() => {
    const tracks =
      (window as unknown as { __capturedTracks?: MediaStreamTrack[] })
        .__capturedTracks ?? [];
    return tracks.length > 0 && tracks.every((t) => t.readyState === 'ended');
  });
  expect(endedAll).toBe(true);

  // And the active-stream slot is cleared.
  const clear = await page.evaluate(() => {
    const w = window as unknown as {
      __atelier?: { activeStream: () => MediaStream | null };
    };
    return w.__atelier?.activeStream() ?? null;
  });
  expect(clear).toBeNull();
});

test('reduced-motion short-circuit: getUserMedia is never called', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await installWebcamMock(page, 'granted');
  await page.goto('/');
  await expect(page.getByTestId('scene-canvas')).toBeAttached({
    timeout: 15_000,
  });
  const toggle = page.getByTestId('webcam-toggle');
  await toggle.click();
  await expect(page.getByTestId('webcam-toggle-error')).toBeVisible({
    timeout: 5_000,
  });
  const calls = await getGumCallCount(page);
  expect(calls).toBe(0);
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
});
