import { expect, test } from '@playwright/test';
import { dismissIntro } from './fixtures/dismiss-intro';

test.beforeEach(async ({ page }) => {
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

  test('project chip cross-link opens the matching project panel', async ({
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

    await expect(panel).toBeHidden({ timeout: 3000 });
    const projectPanel = page.locator('[data-testid^="project-panel-"]');
    await expect(projectPanel.first()).toBeVisible({ timeout: 3000 });
  });
});
