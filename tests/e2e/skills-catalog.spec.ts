import { expect, test } from '@playwright/test';
import { dismissIntro } from './fixtures/dismiss-intro';

test.beforeEach(async ({ page }) => {
  // P10-16 wraps SkillsCatalog through useDockDriver; under SwiftShader
  // the dock spring takes ~15 s to settle, so the Enter→panel-visible wait
  // needs the reduced-motion shortcut to hit the 2D `PanelFrame` path
  // immediately via `useDiegeticPresentation`. Same wedge as the P10-19
  // project-book-open + keyboard-nav + axe specs.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await dismissIntro(page);
});

test.describe('skills catalog', () => {
  test('focus → Enter opens panel, Escape closes it', async ({ page }) => {
    await page.goto('/?time=evening');
    await expect(page.getByTestId('scene-canvas')).toBeAttached({
      timeout: 15_000,
    });
    const hotspot = page.getByTestId('skills-catalog-hotspot');
    await expect(hotspot).toBeAttached({ timeout: 15_000 });

    await hotspot.focus();
    await page.keyboard.press('Enter');

    const panel = page.getByTestId('skills-catalog-panel');
    await expect(panel).toBeVisible({ timeout: 3000 });

    await page.keyboard.press('Escape');
    await expect(panel).toBeHidden({ timeout: 3000 });
  });

  test('grouped headings render', async ({ page }) => {
    await page.goto('/?time=evening');
    await expect(page.getByTestId('scene-canvas')).toBeAttached({
      timeout: 15_000,
    });
    const hotspot = page.getByTestId('skills-catalog-hotspot');
    await expect(hotspot).toBeAttached({ timeout: 15_000 });

    await hotspot.focus();
    await page.keyboard.press('Enter');

    const panel = page.getByTestId('skills-catalog-panel');
    await expect(panel).toBeVisible({ timeout: 3000 });

    await expect(panel.getByRole('heading', { name: /frontend/i })).toBeVisible();
    await expect(panel.getByRole('heading', { name: /backend/i })).toBeVisible();
    await expect(panel.getByRole('heading', { name: /tooling/i })).toBeVisible();
  });

  // FLAKY under SwiftShader post-P10-16.
  //
  // The chip handler now subscribes to the store and waits for
  // `phase === 'closed'` before opening the target project (P10-19
  // follow-up). Unit-level the contract is green: chip click calls
  // close(); after markClosed, open({kind: 'project', id}) fires —
  // asserted in tests/component/SkillsCatalogPanel.test.tsx.
  //
  // End-to-end the same flow drives: close skills (durations.med) →
  // docking → docked → opening (durations.panel) → open. On hardware
  // that's ~250 + 1 frame + 700 ≈ 950 ms. Under SwiftShader's 1–2 fps
  // a useFrame tick balloons to ~500 ms, pushing the cumulative path
  // past the 10 s wait for the project-panel testid non-deterministically.
  //
  // Reactivate once visual regression rebakes run on hardware-accelerated
  // Chrome (Stage B). Tracked in phase-10-tasks.md Deviation 16.
  test.fixme('project chip cross-link opens the matching project panel', async ({
    page,
  }) => {
    await page.goto('/?time=evening');
    await expect(page.getByTestId('scene-canvas')).toBeAttached({
      timeout: 15_000,
    });
    const hotspot = page.getByTestId('skills-catalog-hotspot');
    await expect(hotspot).toBeAttached({ timeout: 15_000 });

    await hotspot.focus();
    await page.keyboard.press('Enter');

    const panel = page.getByTestId('skills-catalog-panel');
    await expect(panel).toBeVisible({ timeout: 3000 });

    const chip = panel
      .getByRole('button', { name: /open .* details/i })
      .first();
    await chip.click();

    // Chip handler chains `close() → setTimeout(open, durations.panel)`.
    // Under reducedMotion the Radix Dialog exit is instant, so the skills
    // panel is removed from the DOM almost synchronously with the click
    // — asserting `toBeHidden` in between races with the removal (Playwright's
    // locator waits for attach-then-hide). We only care that the cross-link
    // lands on the target project panel; 10 s absorbs the full
    // close → docking → docked → opening → open path plus scheduler jitter.
    const projectPanel = page.locator('[data-testid^="project-panel-"]');
    await expect(projectPanel.first()).toBeVisible({ timeout: 10_000 });
  });
});
