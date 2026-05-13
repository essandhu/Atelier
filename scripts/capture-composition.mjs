// Composition-capture helper for the Phase 10 artist brief (P10-17).
//
// Loads the scene at each of the four time-of-day states with post-processing
// disabled (`?effects=off`, landed in commit e388b1d) and writes one PNG per
// state per viewport into the MAIN workspace's
// `docs/phase-10-artist-brief/captures/` tree. `docs/` is gitignored in the
// main workspace — so the captures live outside git entirely, which is the
// documented convention per the artist brief §12 reference-capture package.
//
// Outputs (per brief §9.1 — both desktop and mobile FOV):
//   captures/{state}.png            — 1600 × 1000, drives FOV 35° (BASE_FOV)
//   captures/mobile/{state}.png     — 390 × 844, drives FOV 39° + 12% Z-pull
//                                     via `useIsNarrowViewport` (≤480 px)
//
// Usage:
//   # In one shell, start the dev server:
//   pnpm dev
//
//   # In another shell, run the capture:
//   pnpm assets:capture
//   node scripts/capture-composition.mjs --port=3000
//   node scripts/capture-composition.mjs --output=C:/path/to/captures
//
// The script does NOT start the dev server itself — it expects one running
// on the resolved port. Starting Next from inside the capture script would
// add a 20–30 s startup per invocation + make a clean shutdown harder to
// reason about. Keeping them separate matches the `pnpm e2e` /
// `pnpm dev` division of responsibility used elsewhere.
//
// Design notes:
// - Imports the `chromium` launcher off `@playwright/test`. The test runner
//   is already a devDependency and re-exports the browser-automation API,
//   so no extra package is needed for a one-shot capture.
// - Mobile FOV is purely viewport-width-driven — `src/lib/use-narrow-viewport.ts`
//   matches `(max-width: 480px)`, and `src/scene/Camera.tsx` swaps to
//   FOV 39° + 12% Z-scale when narrow. So the mobile capture just needs
//   a 390-wide context; no app code or query param changes.
// - Waits for `[data-testid="scene-canvas"]` to attach, then sleeps 2 s so
//   the HeroBook/ContactCard/etc. dock-driver home poses settle before the
//   frame grab.

import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Default output lives in the MAIN workspace — this script may run from
// either the main workspace or a `.worktrees/phase-10-a` checkout. Resolve
// against a known-anchor (`atelier`) in the path.
const ATELIER_ROOT = (() => {
  let cur = __dirname;
  for (let i = 0; i < 6; i++) {
    if (cur.endsWith('atelier')) return cur;
    const parent = dirname(cur);
    if (parent === cur) break;
    cur = parent;
  }
  // Fallback: assume the script lives under <root>/scripts.
  return resolve(__dirname, '..');
})();

const DEFAULT_OUTPUT = resolve(
  ATELIER_ROOT,
  'docs',
  'phase-10-artist-brief',
  'captures',
);

const STATES = /** @type {const} */ (['morning', 'day', 'evening', 'night']);

// Two viewports per brief §9.1 ("blockout from the camera position at both
// desktop and mobile FOV"). Desktop drives FOV 35°; mobile (width ≤ 480 px)
// drives FOV 39° + 12% Z-pull via `useIsNarrowViewport`.
const VIEWPORTS = /** @type {const} */ ([
  { name: 'desktop', width: 1600, height: 1000, subdir: '' },
  { name: 'mobile', width: 390, height: 844, subdir: 'mobile' },
]);

const parseArgs = (argv) => {
  const out = { port: 3000, output: DEFAULT_OUTPUT };
  for (const arg of argv) {
    const m = /^--([a-z]+)=(.+)$/.exec(arg);
    if (!m) continue;
    const [, key, value] = m;
    if (key === 'port') out.port = Number(value);
    else if (key === 'output') out.output = resolve(value);
  }
  return out;
};

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const captureState = async (page, { baseURL, state, file }) => {
  const url = `${baseURL}/?time=${state}&effects=off`;
  console.log(`[capture] ${state} → ${url}`);
  // First page hit under Next.js dev can take ~30–60 s to compile; accept
  // that cost on the first state and rely on the intro fixture below so
  // the overlay never occludes the canvas.
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  // `scene-canvas` only mounts once the IntroOverlay dismisses. The
  // prefs-store reads `atelier:prefs:hasSeenIntro` from localStorage on
  // first render, so setting the key in `addInitScript` (installed on the
  // context before any navigation) is enough — a belt-and-braces reload
  // here would only re-trigger Next's compile cost.
  await page.locator('[data-testid="scene-canvas"]').waitFor({
    state: 'attached',
    timeout: 120_000,
  });
  // Startup animation window. The lamp-warmup ramp peaks at 1.5 s for
  // night state and the dock-driver home-pose settle layers on top; under
  // headless SwiftShader the first useFrame writes lag the canvas attach
  // by another beat. Empirically, 2 s leaves the canvas at SURFACE_COLOR
  // on cold runs; 4 s is the smallest reliable margin observed in the
  // capture probe (scripts/_probe.mjs reference).
  await wait(4000);
  await page.screenshot({ path: file, fullPage: false });
  console.log(`[capture] ${state} → ${file}`);
};

const main = async () => {
  const { port, output } = parseArgs(process.argv.slice(2));
  const baseURL = `http://localhost:${port}`;
  console.log(`[capture] dev server expected at ${baseURL}`);
  console.log(`[capture] writing to ${output}`);

  const browser = await chromium.launch();
  try {
    for (const viewport of VIEWPORTS) {
      const viewportOutput = viewport.subdir
        ? resolve(output, viewport.subdir)
        : output;
      await mkdir(viewportOutput, { recursive: true });
      console.log(
        `[capture] ${viewport.name} ${viewport.width}×${viewport.height} → ${viewportOutput}`,
      );
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        // Match the artist-brief capture convention — no post-processing means
        // no motion-driven post fx either; the 2 s settle is enough without
        // also forcing reduced-motion here.
      });
      // Install the hasSeenIntro flag BEFORE any navigation so the IntroOverlay
      // never renders on first paint. Same approach as
      // `tests/e2e/fixtures/dismiss-intro.ts` — lets scene-canvas mount as soon
      // as React commits the tree.
      await context.addInitScript(() => {
        try {
          localStorage.setItem('atelier:prefs:hasSeenIntro', 'true');
        } catch {
          /* private browsing — noop */
        }
      });
      const page = await context.newPage();
      for (const state of STATES) {
        const file = resolve(viewportOutput, `${state}.png`);
        await captureState(page, { baseURL, state, file });
      }
      await context.close();
    }
  } finally {
    await browser.close();
  }
  console.log('[capture] done');
};

main().catch((err) => {
  console.error('[capture] failed:', err);
  process.exit(1);
});
