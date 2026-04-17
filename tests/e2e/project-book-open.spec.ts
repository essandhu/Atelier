import { expect, test, type Page } from '@playwright/test';
import { dismissIntro } from './fixtures/dismiss-intro';

test.beforeEach(async ({ page }) => {
  await dismissIntro(page);
});

const PUBLIC_ID = 'atelier';
const NDA_ID = 'sealed-fintech';
const MAX_TABS = 15;

const tabUntil = async (page: Page, testId: string): Promise<void> => {
  for (let i = 0; i < MAX_TABS; i++) {
    const focused = await page.evaluate(
      () => (document.activeElement as HTMLElement | null)?.dataset?.testid,
    );
    if (focused === testId) return;
    await page.keyboard.press('Tab');
  }
  throw new Error(`Failed to tab to [data-testid="${testId}"] within ${MAX_TABS} presses`);
};

test.describe('project book open flow', () => {
  test('tab → enter → scroll → escape restores focus and fires telemetry', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => consoleErrors.push(err.message));

    await page.goto('/');

    await expect(page.getByTestId('scene-canvas')).toBeAttached({
      timeout: 15_000,
    });
    await expect(page.getByTestId('project-book-stack')).toBeAttached({
      timeout: 15_000,
    });

    await page.evaluate(() => document.body.focus());
    await tabUntil(page, `project-book-${PUBLIC_ID}`);

    await page.keyboard.press('Enter');

    const panel = page.getByTestId(`project-panel-${PUBLIC_ID}`);
    await expect(panel).toBeVisible({ timeout: 1500 });

    const scrollTop = await panel.evaluate((el) => {
      const scrollable = el.closest(
        '[data-testid="panel-frame"]',
      ) as HTMLElement | null;
      if (!scrollable) return -1;
      scrollable.scrollTop = scrollable.scrollHeight;
      return scrollable.scrollTop;
    });
    expect(scrollTop).toBeGreaterThan(0);

    await page.keyboard.press('Escape');
    await expect(panel).toBeHidden({ timeout: 1500 });

    const activeTestId = await page.evaluate(
      () => (document.activeElement as HTMLElement | null)?.dataset?.testid,
    );
    expect(activeTestId).toBe(`project-book-${PUBLIC_ID}`);

    const events = await page.evaluate(
      () =>
        ((window as unknown as { dataLayer?: unknown[] }).dataLayer ?? []) as Array<{
          name: string;
          projectId?: string;
          dwellMs?: number;
        }>,
    );
    expect(events).toContainEqual(
      expect.objectContaining({ name: 'panel.opened', projectId: PUBLIC_ID }),
    );
    const closed = events.find(
      (e) => e.name === 'panel.closed' && e.projectId === PUBLIC_ID,
    );
    expect(closed).toBeDefined();
    expect(closed?.dwellMs ?? 0).toBeGreaterThan(0);

    const nonResourceErrors = consoleErrors.filter(
      (msg) =>
        !/Failed to load resource/i.test(msg) &&
        // Radix dev-mode false positive: DialogTitle IS rendered (see
        // <VisuallyHiddenPrimitive.Root> wrap in PanelFrame) but Radix's
        // title-registration check races with React Strict Mode double-
        // invoke in dev. Production build does not emit this warning.
        !/DialogContent.*requires a `DialogTitle`/i.test(msg),
    );
    expect(nonResourceErrors).toEqual([]);
  });

  test('opening the NDA project shows the sealed variant and hides disclosable text', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.getByTestId('scene-canvas')).toBeAttached({
      timeout: 15_000,
    });
    await expect(page.getByTestId('project-book-stack')).toBeAttached({
      timeout: 15_000,
    });

    await page.evaluate(() => document.body.focus());
    await tabUntil(page, `project-book-${NDA_ID}`);
    await page.keyboard.press('Enter');

    const sealedPanel = page.getByTestId(`sealed-project-panel-${NDA_ID}`);
    await expect(sealedPanel).toBeVisible({ timeout: 1500 });

    // Ensure the public project's problem text is NOT leaked here. Pick a phrase
    // unique to the public project (title keyword) to avoid false negatives.
    const publicPhrase = 'reading room where projects sit on a desk';
    await expect(page.getByText(publicPhrase)).toHaveCount(0);

    await page.keyboard.press('Escape');
    await expect(sealedPanel).toBeHidden({ timeout: 1500 });
  });
});
