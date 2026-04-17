import { expect, test } from '@playwright/test';

// Phase 5 hard-gate perf harness. Observes 10 s of requestAnimationFrame
// deltas per state and fails if the p5 frame rate drops below 55 fps.
//
// Known caveat: GitHub Actions `ubuntu-latest` runners render via SwiftShader
// software fallback and do not reliably hit 55 fps even for a clean scene.
// The spec is gated on ATELIER_PERF_HARDGATE so main CI stays fast; preview
// deploys (real hardware) set the flag and enforce the gate. See
// docs/perf-gates.md.

const ENABLED = Boolean(process.env.ATELIER_PERF_HARDGATE);
const STATES = ['morning', 'day', 'evening', 'night'] as const;

for (const state of STATES) {
  test(`${state} state sustains p5 ≥ 55 fps over 10 s`, async ({ page }) => {
    test.skip(
      !ENABLED,
      'perf hard gate disabled — set ATELIER_PERF_HARDGATE=1 to enforce',
    );
    await page.goto(`/?time=${state}`);
    const wrapper = page.getByTestId('scene-canvas');
    await expect(wrapper).toBeAttached({ timeout: 10_000 });
    await expect(wrapper.locator('canvas')).toBeAttached({ timeout: 10_000 });
    // Wait for the scene to settle before sampling.
    await page.waitForTimeout(2000);

    const samples = await page.evaluate(
      () =>
        new Promise<number[]>((resolve) => {
          const stamps: number[] = [];
          let last = performance.now();
          const start = last;
          const tick = (now: number) => {
            stamps.push(now - last);
            last = now;
            if (now - start < 10_000) {
              requestAnimationFrame(tick);
            } else {
              resolve(stamps);
            }
          };
          requestAnimationFrame(tick);
        }),
    );

    // Discard the first 15 samples (post-idle settle noise).
    const usable = samples.slice(15);
    const fps = usable.map((dt) => 1000 / dt).sort((a, b) => a - b);
    const p5 = fps[Math.floor(fps.length * 0.05)] ?? 0;
    const median = fps[Math.floor(fps.length * 0.5)] ?? 0;

    test.info().annotations.push(
      { type: 'state', description: state },
      { type: 'p5fps', description: p5.toFixed(2) },
      { type: 'medianfps', description: median.toFixed(2) },
    );

    expect(p5, `p5 fps too low on ${state} state`).toBeGreaterThanOrEqual(55);
  });
}
