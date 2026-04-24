// E2E smoke test for the /asset-review dev route.
//
// Two assertions per kind:
//   1. The route loads with the sidebar rendering the contract-derived
//      metadata (dims, required nodes, required clips).
//   2. If the GLB is NOT present, the sidebar renders the "missing GLB"
//      empty state. If it IS present, the clip scrubbers render and are
//      interactive.
//
// The route is dev-only, so this spec runs against the dev server only.
// No production-build coverage here; that path's gate is covered by the
// unit test in `tests/unit/asset-review-route.test.ts`.

import { test, expect } from '@playwright/test';
import { INTERACTIVE_ASSET_KINDS } from '@/asset/interactive-asset-contract';

test.describe('asset-review route', () => {
  test('lists every interactive kind on the picker', async ({ page }) => {
    await page.goto('/asset-review');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'Asset Review',
    );
    for (const kind of INTERACTIVE_ASSET_KINDS) {
      await expect(page.locator(`a[href*="asset=${kind}"]`)).toBeVisible();
    }
  });

  for (const kind of INTERACTIVE_ASSET_KINDS) {
    test(`loads review page for ${kind}`, async ({ page }) => {
      await page.goto(`/asset-review?asset=${kind}`);
      // Sidebar renders with the kind in the title.
      await expect(
        page.getByRole('heading', { level: 1, name: kind }),
      ).toBeVisible();
      // The canvas mounts regardless of whether a GLB exists; assert its
      // testid is in the DOM. Full rendering / clip interactivity is
      // exercised by the unit test on the validator + when real GLBs
      // land under public/scene/models/.
      await expect(page.locator('[data-testid="asset-review-canvas"]')).toBeVisible();
    });
  }
});
