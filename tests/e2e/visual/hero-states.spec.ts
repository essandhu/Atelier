import { existsSync } from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';

// Phase 2 ships only the evening baseline. Morning / day / night arrive in
// Phase 5 alongside the resolver and remaining lightmaps. Baseline PNG must
// be generated on hardware-accelerated WebGL — Playwright's default on Windows
// falls back to SwiftShader which produces a visibly different image than CI
// Linux. Regeneration is a deliberate act documented in phase-N-review.md:
//
//   pnpm exec playwright test tests/e2e/visual/hero-states.spec.ts --update-snapshots
//
// Until the baseline is committed at tests/e2e/visual/hero-states.spec.ts-snapshots/
// the spec skips so CI stays green. Once committed, the spec compares
// automatically on every PR.
const BASELINE_DIR = path.resolve(
  __dirname,
  'hero-states.spec.ts-snapshots',
);
const HAS_BASELINE = existsSync(BASELINE_DIR);

test('evening composition matches baseline within 1% pixel difference', async ({
  page,
}) => {
  test.skip(
    !HAS_BASELINE,
    'no committed baseline — regenerate with --update-snapshots on hardware-WebGL and commit',
  );
  await page.goto('/');
  const wrapper = page.getByTestId('scene-canvas');
  await expect(wrapper).toBeAttached({ timeout: 10_000 });
  await expect(wrapper.locator('canvas')).toBeAttached({ timeout: 10_000 });
  await page.waitForTimeout(750);

  await expect(page).toHaveScreenshot('evening.png', {
    maxDiffPixelRatio: 0.01,
    fullPage: false,
  });
});
