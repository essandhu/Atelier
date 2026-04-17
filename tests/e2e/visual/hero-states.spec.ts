import { existsSync } from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';

// Phase 5 extends the visual baseline to all four time-of-day states. Because
// hardware-accelerated WebGL output differs from Playwright's SwiftShader
// fallback, the baseline PNGs must be generated on real GPU hardware and
// committed explicitly:
//
//   pnpm exec playwright test tests/e2e/visual/hero-states.spec.ts --update-snapshots
//
// Until the directory exists (and ATELIER_VISUAL_REGRESSION is set on CI),
// the spec skips so main CI stays fast and the dedicated visual-regression
// workflow carries the gate. See .github/workflows/visual-regression.yml.

const BASELINE_DIR = path.resolve(
  __dirname,
  'hero-states.spec.ts-snapshots',
);
const HAS_BASELINE = existsSync(BASELINE_DIR);
const ENABLED = Boolean(process.env.ATELIER_VISUAL_REGRESSION);

const STATES = ['morning', 'day', 'evening', 'night'] as const;

for (const state of STATES) {
  test(`${state} composition matches baseline within 1% pixel difference`, async ({
    page,
  }) => {
    test.skip(
      !ENABLED || !HAS_BASELINE,
      'visual regression disabled — set ATELIER_VISUAL_REGRESSION=1 and commit baselines',
    );
    await page.goto(`/?time=${state}`);
    const wrapper = page.getByTestId('scene-canvas');
    await expect(wrapper).toBeAttached({ timeout: 10_000 });
    await expect(wrapper.locator('canvas')).toBeAttached({ timeout: 10_000 });
    await page.waitForTimeout(750);

    await expect(page).toHaveScreenshot(`${state}.png`, {
      maxDiffPixelRatio: 0.01,
      fullPage: false,
    });
  });
}
