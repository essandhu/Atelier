import type { Page } from '@playwright/test';

/**
 * Seed `prefsStore.hasSeenIntro=true` via localStorage so the IntroOverlay
 * does not render on first paint. Use in specs that care about scene/UI
 * behaviour independent of the intro. The `addInitScript` runs on every new
 * document the page creates, so it is safe to call once in `beforeEach`.
 */
export const dismissIntro = async (page: Page): Promise<void> => {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('atelier:prefs:hasSeenIntro', 'true');
    } catch {
      /* private browsing — noop */
    }
  });
};
