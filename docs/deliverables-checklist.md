# Atelier Deliverables Checklist

> Auto-generated from `docs/architecture.md` on 2026-04-16.
> Updated at each phase boundary. Items are checked off as they are completed.
> Legend: `[ ]` pending · `[x]` complete · `[~]` deferred/superseded (with note).

## Root Configuration
- [x] `README.md` — product-first README per Section 10.1 (skeleton in P1; full version Phase 5)
- [x] `LICENSE` — MIT for code, all-rights-reserved note for content
- [x] `package.json` — with `packageManager: pnpm@9.x` pin
- [x] `pnpm-lock.yaml`
- [x] `tsconfig.json`
- [x] `next.config.mjs`
- [x] `tailwind.config.ts`
- [x] `postcss.config.mjs`
- [x] `vitest.config.ts`
- [x] `playwright.config.ts`
- [x] `components.json` — shadcn/ui config
- [x] `eslint.config.mjs`
- [x] `.prettierrc`
- [x] `.env.example`
- [x] `.gitignore`
- [x] `.nvmrc` — pinned to 20.x
- [x] `instrumentation.ts` — Next.js Sentry init hook
- [x] `sentry.client.config.ts`
- [x] `sentry.server.config.ts`
- [x] `sentry.edge.config.ts`

## Documentation
- [x] `docs/BRIEF.md`
- [x] `docs/architecture.md`
- [x] `docs/architecture-review.md`
- [x] `docs/deliverables-checklist.md` — this file

## Public Assets
- [x] `public/favicon.svg`
- [ ] `public/fonts/inter-variable.woff2`
- [ ] `public/fonts/jetbrains-mono-variable.woff2`
- [ ] `public/scene/models/desk.glb` — Draco-compressed geometry
- [ ] `public/scene/textures/desk-albedo.ktx2`
- [ ] `public/scene/textures/desk-normal.ktx2`
- [ ] `public/scene/textures/desk-roughness.ktx2`
- [ ] `public/scene/textures/` — additional PBR textures for lamp, window frame, book materials
- [ ] `public/scene/lightmaps/morning.ktx2`
- [ ] `public/scene/lightmaps/day.ktx2`
- [ ] `public/scene/lightmaps/evening.ktx2`
- [ ] `public/scene/lightmaps/night.ktx2`

## App Routes
- [x] `src/app/layout.tsx`
- [x] `src/app/page.tsx` — the scene page — PARTIAL: P1 ships a server-fetched debug page; Phase 2 replaces with the R3F scene
- [x] `src/app/globals.css`
- [ ] `src/app/opengraph-image.tsx` — pre-rendered evening hero
- [x] `src/app/fallback/page.tsx` — no-JS semantic portfolio — PARTIAL: minimal semantic version; Phase 5 owns the styled fallback
- [x] `src/app/api/health/route.ts` — GitHub connectivity smoke test
- [x] `src/app/api/revalidate/route.ts` — authenticated ISR webhook

## Scene Subsystem
- [ ] `src/scene/Scene.tsx` — root R3F Canvas + composition
- [ ] `src/scene/Camera.tsx` — fixed camera + optional parallax
- [ ] `src/scene/Desk.tsx`
- [ ] `src/scene/Window.tsx`
- [ ] `src/scene/Lamp.tsx`
- [ ] `src/scene/live-activity/LiveActivityBook.tsx`
- [ ] `src/scene/live-activity/ContributionGrid.tsx` — left page, 3D-extruded
- [ ] `src/scene/live-activity/EventsFeed.tsx` — right page via drei `<Html>`
- [ ] `src/scene/live-activity/materials.ts`
- [ ] `src/scene/project-books/ProjectBookStack.tsx`
- [ ] `src/scene/project-books/ProjectBook.tsx`
- [ ] `src/scene/project-books/spine-design.ts` — per-project spine factory
- [ ] `src/scene/ambient/DustMotes.tsx`
- [ ] `src/scene/ambient/PageFlutter.tsx`
- [ ] `src/scene/ambient/LampBreathe.tsx`
- [ ] `src/scene/post-processing/Effects.tsx` — bloom, CA, grain, tonemap per state
- [ ] `src/scene/lighting/Lightmaps.tsx` — loads only the active state's map
- [ ] `src/scene/lighting/RealTimeLights.tsx` — lamp key light + hover highlights
- [ ] `src/scene/lighting/bake-presets.ts` — per-state intensity/color tables

## Content Layer
- [x] `src/content/profile.ts` — name, role, city, github username (seeded placeholder in P1, real content later)
- [x] `src/content/projects/index.ts` — ordered array
- [x] `src/content/projects/schemas.ts` — Zod `Project` schema
- [x] `src/content/projects/<slug>.ts` — one module per project (≥1 placeholder in P1, ≥1 real in P4) — PARTIAL: `placeholder.ts` only
- [x] `src/content/skills/index.ts`
- [x] `src/content/skills/schemas.ts` — Zod `Skill` schema
- [x] `src/content/skills/<slug>.ts` — per-skill modules (≥1 placeholder in P1) — PARTIAL: `placeholder.ts` only
- [x] `src/content/experience/index.ts`
- [x] `src/content/experience/schemas.ts` — Zod `ExperienceEntry` schema
- [ ] `src/content/experience/<slug>.ts` — per-role modules

## GitHub Data Layer
- [x] `src/data/github/client.ts` — server-only GraphQL fetcher (`import 'server-only'`)
- [x] `src/data/github/queries.ts` — `UserContributions` + `UserActivity` documents
- [x] `src/data/github/types.ts` — GraphQL response types
- [x] `src/data/github/transform.ts` — includes `quantize()` (Section 5.3)
- [x] `src/data/github/cache.ts` — ISR revalidate tags + ttl factory
- [x] `src/data/loaders/projects.ts` — typed loader over `content/` (projects/skills/experience/profile)

## Time-of-Day System
- [ ] `src/time-of-day/resolve.ts` — hour/URL → TimeOfDayState
- [ ] `src/time-of-day/presets.ts` — lightmap + post-fx per state
- [ ] `src/time-of-day/types.ts`

## Interaction Layer
- [ ] `src/interaction/keyboard.ts` — tab order + Esc routing
- [ ] `src/interaction/pointer.ts` — hover + click dispatcher
- [ ] `src/interaction/webcam/FaceTracker.tsx` — lazy MediaPipe wrapper
- [ ] `src/interaction/webcam/parallax.ts` — head pose → camera offset (one-euro filter)
- [ ] `src/interaction/webcam/gate.tsx` — opt-in prompt + consent storage

## UI Layer
- [ ] `src/ui/panels/PanelFrame.tsx`
- [ ] `src/ui/panels/ProjectPanel.tsx`
- [ ] `src/ui/panels/SealedProjectPanel.tsx` — NDA variant
- [ ] `src/ui/panels/EventsFeedPanel.tsx`
- [ ] `src/ui/intro/IntroOverlay.tsx`
- [ ] `src/ui/intro/StartupSequence.tsx`
- [ ] `src/ui/controls/WebcamToggle.tsx`
- [ ] `src/ui/controls/AccentProvider.tsx` — CSS variable plumbing
- [ ] `src/ui/a11y/SkipToFallback.tsx`
- [ ] `src/ui/a11y/LiveRegion.tsx`
- [ ] `src/ui/primitives/button.tsx` — shadcn-generated
- [ ] `src/ui/primitives/dialog.tsx` — shadcn-generated
- [ ] `src/ui/primitives/` — additional shadcn primitives as panels require
- [ ] `src/ui/motion/tokens.ts` — eased curves, durations

## Stores
- [ ] `src/store/scene-store.ts` — Zustand: activePanel, hoveredObject
- [ ] `src/store/prefs-store.ts` — Zustand: reducedMotion, webcamOptIn, hasSeenIntro
- [ ] `src/store/time-of-day-store.ts` — Zustand: resolved state (write-once)

## Telemetry
- [x] `src/telemetry/events.ts` — typed custom event names + `track()`
- [x] `src/telemetry/web-vitals.ts` — Next.js web-vitals reporter

## Styles
- [ ] `src/styles/tokens.css` — accent color + type tokens

## Lib
- [x] `src/lib/env.ts` — zod-validated env access
- [x] `src/lib/logger.ts` — pino-based server logger
- [x] `src/lib/utils.ts` — shadcn `cn()` helper

## Scripts
- [x] `scripts/asset-pipeline/compress-geometry.mjs` — Draco via `@gltf-transform`
- [x] `scripts/asset-pipeline/compress-textures.mjs` — KTX2/Basis via `@gltf-transform` — PARTIAL: classifier-only stub; Phase 2 wires the real transcoder (see Phase 1 Deviation 7)
- [x] `scripts/asset-pipeline/verify-budgets.mjs` — fails CI if scene assets > 15MB
- [x] `scripts/asset-pipeline/verify-bundle-size.mjs` — fails CI if any route > 1MB gzipped (see Phase 1 Deviation 5)
- [ ] `scripts/bake-lightmaps.md` — Blender workflow reference

## Tests — Unit (Vitest)
- [ ] `tests/unit/time-of-day.test.ts` — resolve()/override cases
- [x] `tests/unit/github-transform.test.ts` — quantize() + GraphQL fixture contract
- [x] `tests/unit/content-schemas.test.ts` — every content module parses
- [x] `tests/unit/env.test.ts` — env zod validation
- [x] `tests/unit/fixtures/github-contributions.json` — fixture for the contract test

## Tests — Component (Vitest + RTL)
- [ ] `tests/component/ProjectPanel.test.tsx`
- [ ] `tests/component/IntroOverlay.test.tsx`
- [ ] `tests/component/SealedProjectPanel.test.tsx` — NDA field redaction

## Tests — E2E (Playwright)
- [ ] `tests/e2e/fixtures/github-mock.ts` — mocked GraphQL fixture
- [x] `tests/e2e/scene-load.spec.ts` — PARTIAL: Phase 1 smoke test (asserts contribution-total span). Phase 2 evolves it to verify scene mount.
- [ ] `tests/e2e/project-book-open.spec.ts` — open→scroll→close + focus restoration
- [ ] `tests/e2e/time-of-day-override.spec.ts` — four `?time=` states
- [ ] `tests/e2e/keyboard-nav.spec.ts` — tab order stability
- [ ] `tests/e2e/reduced-motion.spec.ts` — startup + ambient damping
- [ ] `tests/e2e/fallback.spec.ts` — no-JS meta-refresh to `/fallback`
- [ ] `tests/e2e/visual/hero-states.spec.ts` — screenshot-per-state regression
- [ ] `tests/e2e/visual/baseline/` — committed baseline PNGs per state

## Performance Gates (live in CI)
- [x] Bundle-size guard — parses `next build` report, fails >1MB gzipped (landed in P1 — see Deviation 5)
- [ ] Lighthouse CI on preview deploys — night-state perf ≥ 80 desktop, LCP < 2.5s, CLS < 0.1
- [ ] Playwright perf harness — p5 frame rate ≥ 55fps per state during 10s idle

## CI/CD
- [x] `.github/workflows/ci.yml` — typecheck, lint, unit, e2e, asset budget, bundle-size (Lighthouse + visual-regression land Phase 5)
- [ ] `.github/workflows/visual-regression.yml` — screenshot diff on preview deploys

## Security & Headers (added by Phase 1 — see Deviation 6)
- [x] CSP + Permissions-Policy + Referrer-Policy + nosniff/X-Frame-Options in `next.config.mjs`

## Post-V1 (explicitly deferred — tracked so they don't get lost)
- [~] Globe with current-location marker — DEFERRED: Post-V1 roadmap (Section 8)
- [~] Skills / tech catalog 3D object + panel — DEFERRED: Post-V1 roadmap
- [~] Additional project books beyond the one proven in V1 — DEFERRED: Post-V1 roadmap
- [~] Webcam MediaPipe integration end-to-end — DEFERRED: scaffolding lands in V1 (files above), live integration Post-V1
- [~] Device orientation parallax on mobile — DEFERRED: Post-V1
- [~] Full background treatment (bookshelf, wall piece) — DEFERRED: Post-V1
- [~] Additional ambient objects (coffee cup, plant, pen, notes) — DEFERRED: Post-V1
- [~] Live transitions between time-of-day states — DEFERRED: ADR-005 bars this from V1; Post-V1 only if warranted
- [~] AI "Ask the site" chatbot — DEFERRED: Section 6 (moderation surface area, off-mission)
- [~] Auto-generated project summaries from READMEs — DEFERRED: Section 6 (conflicts with ADR-006)
