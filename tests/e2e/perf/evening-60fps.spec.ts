import { expect, test } from '@playwright/test';

// Advisory only in Phase 2 (per docs/phase-2-tasks.md Deviation 3). Hard CI
// enforcement lives in the Phase 5 perf harness (§9.5 architecture) where
// hardware-accelerated WebGL is available. Chromium under Playwright on
// Windows/Mac typically falls back to SwiftShader software rendering, which
// reports p5 well below 55fps even on a healthy scene. This spec therefore
// measures p5 and records it as a test annotation for manual review, but only
// fails if the scene produced no frames at all (catching catastrophic
// regressions like a mount failure).
test('evening scene produces frames over 10s of idle observation (advisory)', async ({
  page,
}) => {
  await page.goto('/');
  const wrapper = page.getByTestId('scene-canvas');
  await expect(wrapper).toBeAttached({ timeout: 10_000 });
  await expect(wrapper.locator('canvas')).toBeAttached({ timeout: 10_000 });
  await page.waitForTimeout(500);

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

  const usable = samples.slice(15);
  const fps = usable.map((dt) => 1000 / dt).sort((a, b) => a - b);
  const p5Index = Math.floor(fps.length * 0.05);
  const p5 = fps[p5Index] ?? 0;
  const median = fps[Math.floor(fps.length * 0.5)] ?? 0;

  test
    .info()
    .annotations.push(
      { type: 'p5fps', description: p5.toFixed(2) },
      { type: 'medianfps', description: median.toFixed(2) },
      { type: 'frameCount', description: String(samples.length) },
    );

  // Hard gate: catastrophic mount failure means 0 frames. Everything else is
  // advisory and reviewed against `docs/phase-2-tasks.md` acceptance test
  // (manual 60fps run on M1 Air class hardware).
  expect(samples.length, 'scene produced no rAF ticks').toBeGreaterThan(0);
});
