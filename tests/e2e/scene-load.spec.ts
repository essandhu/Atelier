import { expect, test } from '@playwright/test';

// Phase 1: smoke test — proves the debug page server-renders a numeric
// contribution total when a valid GitHub PAT is available. Phase 2 evolves
// this spec to verify scene mount. The dev server itself always needs a
// (real or dummy) GITHUB_PAT to satisfy the env Zod schema; if the PAT is a
// dummy value the GitHub API returns 401 and the page renders the error
// path — in that case we skip the contribution assertion.
test('home page renders a server-rendered contribution total', async ({ page }) => {
  const response = await page.goto('/');
  expect(response?.status()).toBe(200);

  const total = page.getByTestId('contribution-total');
  const visible = await total.isVisible().catch(() => false);
  test.skip(
    !visible,
    'contribution-total not present — running with dummy PAT or GitHub unreachable',
  );

  const text = await total.innerText();
  expect(/^\d+$/.test(text.trim())).toBe(true);
});
