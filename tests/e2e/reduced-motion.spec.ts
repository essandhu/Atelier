import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

test('IntroOverlay marks itself as reduced-motion', async ({ page }) => {
  await page.goto('/?time=evening');
  const overlay = page.getByTestId('intro-overlay');
  await expect(overlay).toBeAttached({ timeout: 10_000 });
  await expect(overlay).toHaveAttribute('data-reduced-motion', 'true');
});

test('StartupSequence is absent under reduced motion', async ({ page }) => {
  await page.goto('/?time=night');
  await expect(page.getByTestId('scene-canvas').locator('canvas')).toBeAttached(
    { timeout: 10_000 },
  );
  // Give the scene a moment to settle; the marker, if present, would render
  // synchronously on mount.
  await page.waitForTimeout(500);
  await expect(page.getByTestId('startup-sequence')).toHaveCount(0);
});
