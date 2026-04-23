import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { dismissIntro } from '../fixtures/dismiss-intro';

/**
 * axe-core baseline (P9-05).
 *
 * Blocking threshold is `impact: serious | critical`. Minor and moderate
 * findings are not blocking but are logged so they stay visible. The
 * matrix covers:
 *   - `/` in all four time-of-day states (palette contrast is the
 *     most state-sensitive axe rule family)
 *   - `/fallback` (no-JS page)
 *   - Each open panel (project, skills, globe)
 *
 * See `tests/e2e/a11y/README.md` for the full matrix + how to reproduce
 * locally.
 */

const BLOCKING_IMPACTS: Array<'serious' | 'critical'> = [
  'serious',
  'critical',
];

const runAxe = async (page: Page, label: string): Promise<void> => {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'])
    // `tabindex` conflicts with the deliberate TAB_ORDER architecture
    // (docs/keyboard-nav.md + src/interaction/tab-order.ts). Positive
    // tabindex values are how we model "sparse focus on a diegetic scene"
    // — disabling the rule is the only way to keep the rest of the axe
    // suite green against our intentional design.
    .disableRules(['tabindex'])
    .analyze();

  const blocking = results.violations.filter((v) =>
    BLOCKING_IMPACTS.includes(v.impact as 'serious' | 'critical'),
  );
  const advisory = results.violations.filter(
    (v) => !BLOCKING_IMPACTS.includes(v.impact as 'serious' | 'critical'),
  );

  if (advisory.length > 0) {
    // Non-blocking log — keeps minor/moderate findings visible in CI output
    // without failing the gate. Disposition lives in docs/a11y-audit.md.
    console.log(
      `[axe ${label}] ${advisory.length} non-blocking finding(s):`,
      advisory.map((v) => ({ id: v.id, impact: v.impact })),
    );
  }

  expect.soft(blocking, `[axe ${label}] serious/critical violations`).toEqual(
    [],
  );
  if (blocking.length > 0) {
    // Attach the full payload so the CI log has enough context to act on.
    console.error(
      `[axe ${label}] ${blocking.length} blocking violation(s):`,
      JSON.stringify(blocking, null, 2),
    );
  }
  expect(blocking.length).toBe(0);
};

const waitForScene = async (page: Page): Promise<void> => {
  await expect(
    page.getByTestId('scene-canvas').locator('canvas'),
  ).toBeAttached({ timeout: 15_000 });
};

test.describe('Accessibility — root route', () => {
  const states = ['evening', 'morning', 'day', 'night'] as const;

  for (const state of states) {
    test(`/?time=${state} — zero serious/critical`, async ({ page }) => {
      await dismissIntro(page);
      await page.goto(`/?time=${state}`);
      await waitForScene(page);
      await runAxe(page, `/?time=${state}`);
    });
  }
});

test.describe('Accessibility — panels', () => {
  test('project panel open — zero serious/critical', async ({ page }) => {
    await dismissIntro(page);
    await page.goto('/?time=evening');
    await waitForScene(page);
    // Atelier is now the desk-centre HeroBook (P10-09); its open-panel a11y
    // tree is the same `project-panel-atelier` as before because both the
    // HeroBook and a project book share the ProjectPanel body.
    await expect(page.getByTestId('hero-book')).toBeAttached({
      timeout: 15_000,
    });
    await page.getByTestId('hero-book').focus();
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('project-panel-atelier')).toBeVisible();
    await runAxe(page, 'project panel open');
  });

  test('skills-catalog panel open — zero serious/critical', async ({
    page,
  }) => {
    await dismissIntro(page);
    await page.goto('/?time=evening');
    await waitForScene(page);
    await expect(page.getByTestId('skills-catalog-hotspot')).toBeAttached({
      timeout: 15_000,
    });
    await page.getByTestId('skills-catalog-hotspot').focus();
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('skills-catalog-panel')).toBeVisible();
    await runAxe(page, 'skills-catalog panel open');
  });

  test('globe panel open — zero serious/critical', async ({ page }) => {
    await dismissIntro(page);
    await page.goto('/?time=evening');
    await waitForScene(page);
    await expect(page.getByTestId('globe-hotspot')).toBeAttached({
      timeout: 15_000,
    });
    await page.getByTestId('globe-hotspot').focus();
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('globe-panel')).toBeVisible();
    await runAxe(page, 'globe panel open');
  });
});

test.describe('Accessibility — fallback route', () => {
  test('/fallback — zero serious/critical', async ({ page }) => {
    await page.goto('/fallback');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await runAxe(page, '/fallback');
  });
});
