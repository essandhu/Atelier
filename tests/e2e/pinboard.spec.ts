import { expect, test } from '@playwright/test';
import { dismissIntro } from './fixtures/dismiss-intro';

/**
 * P10-19 — Pinboard (wall, non-dockable).
 *
 * §5.11 / §11.3: clicking the pinboard opens `EventsFeedPanel` in 2D. The
 * pinboard is non-dockable (parity with the globe), so the short scene-store
 * path `closed → opening → open` applies; no docking phase, no on-object
 * reading surface.
 *
 * Card tooltips: each PinboardCard carries a `title` attribute (native
 * tooltip) and `aria-label` mirroring the tooltip copy; hovering a card
 * flips `data-hovered="true"` on the card root.
 */

test.beforeEach(async ({ page }) => {
  await dismissIntro(page);
});

test.describe('pinboard', () => {
  test('Enter on the pinboard hotspot opens EventsFeedPanel in 2D', async ({
    page,
  }) => {
    await page.goto('/?time=evening');
    await expect(page.getByTestId('scene-canvas')).toBeAttached({
      timeout: 15_000,
    });
    const hotspot = page.getByTestId('pinboard-hotspot');
    await expect(hotspot).toBeAttached({ timeout: 15_000 });

    await hotspot.focus();
    await page.keyboard.press('Enter');

    const panel = page.getByTestId('events-feed-panel');
    await expect(panel).toBeVisible({ timeout: 3000 });
    // Non-dockable parity with globe: 2D PanelFrame hosts the body.
    await expect(page.getByTestId('panel-frame')).toBeVisible();
  });

  test('opening the events feed fires panel.opened telemetry', async ({
    page,
  }) => {
    await page.goto('/?time=evening');
    await expect(page.getByTestId('scene-canvas')).toBeAttached({
      timeout: 15_000,
    });
    const hotspot = page.getByTestId('pinboard-hotspot');
    await expect(hotspot).toBeAttached({ timeout: 15_000 });

    await hotspot.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('events-feed-panel')).toBeVisible({
      timeout: 3000,
    });

    const events = await page.evaluate(
      () =>
        ((window as unknown as { dataLayer?: unknown[] }).dataLayer ??
          []) as Array<{
          name: string;
          panelId?: string;
        }>,
    );
    expect(events).toContainEqual(
      expect.objectContaining({ name: 'panel.opened', panelId: 'events' }),
    );
  });

  test('each pin card exposes tooltip copy via aria-label + title', async ({
    page,
  }) => {
    await page.goto('/?time=evening');
    await expect(page.getByTestId('scene-canvas')).toBeAttached({
      timeout: 15_000,
    });
    // Pinboard only mounts when the fixture snapshot derives ActivityStats.
    // Assert all four cards expose the tooltip handle — §5.11 contract.
    // The DOM `title` attribute drives native hover tooltips (pointer-over
    // the DOM element triggers them). 3D-mesh hover state (the
    // `data-hovered` attribute) is set from R3F raycaster events which
    // Playwright's CSS-coordinate `mouse` doesn't reach — so this spec
    // asserts the copy contract, not the 3D pointer interaction.
    const cards = [
      { testid: 'pinboard-card-commits', re: /commits in 90 days/i },
      { testid: 'pinboard-card-streak', re: /day streak/i },
      { testid: 'pinboard-card-prs', re: /PRs merged in 90 days/i },
      { testid: 'pinboard-card-heatmap', re: /heatmap/i },
    ];
    for (const { testid, re } of cards) {
      const card = page.getByTestId(testid);
      await expect(card).toBeAttached({ timeout: 15_000 });
      const ariaLabel = await card.getAttribute('aria-label');
      const title = await card.getAttribute('title');
      expect(ariaLabel ?? '').toMatch(re);
      expect(title ?? '').toMatch(re);
    }
  });

  test('globe hotspot still opens the 2D globe panel (non-dockable parity)', async ({
    page,
  }) => {
    await page.goto('/?time=evening');
    await expect(page.getByTestId('scene-canvas')).toBeAttached({
      timeout: 15_000,
    });
    const globe = page.getByTestId('globe-hotspot');
    await expect(globe).toBeAttached({ timeout: 15_000 });

    await globe.focus();
    await page.keyboard.press('Enter');

    await expect(page.getByTestId('globe-panel')).toBeVisible({
      timeout: 3000,
    });
    await expect(page.getByTestId('panel-frame')).toBeVisible();
  });
});
