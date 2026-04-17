import { expect, test, type Page } from '@playwright/test';
import { dismissIntro } from './fixtures/dismiss-intro';

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

const tabUntil = async (
  page: Page,
  testId: string,
  maxTabs = 15,
): Promise<void> => {
  for (let i = 0; i < maxTabs; i++) {
    const focused = await page.evaluate(
      () => (document.activeElement as HTMLElement | null)?.dataset?.testid,
    );
    if (focused === testId) return;
    await page.keyboard.press('Tab');
  }
  throw new Error(`Failed to tab to [data-testid="${testId}"]`);
};

test('Opening a project book under reduced motion uses the shortened path', async ({
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

  await page.evaluate(() => document.body.focus());
  await tabUntil(page, 'project-book-atelier');

  await page.keyboard.press('Enter');

  // `data-reduced-motion` on the DialogContent is sourced from prefs-store's
  // `reducedMotion`, which seeds from `matchMedia('(prefers-reduced-motion:
  // reduce)')`. ProjectBook reads that same matchMedia signal in its
  // `useFrame` loop, so a true mark here proves the book-open animation
  // selected `durations.fast` (150 ms) instead of `durations.bookOpen`
  // (800 ms).
  const panel = page.getByTestId('panel-frame');
  await expect(panel).toBeVisible({ timeout: 1500 });
  await expect(panel).toHaveAttribute('data-reduced-motion', 'true');

  await page.keyboard.press('Escape');
  await expect(panel).toBeHidden({ timeout: 1500 });
});
