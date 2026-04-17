# Atelier Deliverables Checklist

> Auto-generated from `docs/architecture.md` on 2026-04-16.
> Updated at each phase boundary. Items are checked off as they are completed.
> Legend: `[ ]` pending · `[x]` complete · `[~]` deferred/superseded (with note).

## Root Configuration
- [ ] `README.md` — product-first README per Section 10.1
- [ ] `LICENSE` — MIT for code, all-rights-reserved note for content
- [ ] `package.json` — with `packageManager: pnpm@9.x` pin
- [ ] `pnpm-lock.yaml`
- [ ] `tsconfig.json`
- [ ] `next.config.mjs`
- [ ] `tailwind.config.ts`
- [ ] `postcss.config.mjs`
- [ ] `vitest.config.ts`
- [ ] `playwright.config.ts`
- [ ] `components.json` — shadcn/ui config
- [ ] `eslint.config.mjs`
- [ ] `.prettierrc`
- [ ] `.env.example`
- [ ] `.gitignore`
- [ ] `.nvmrc` — pinned to 20.x
- [ ] `instrumentation.ts` — Next.js Sentry init hook
- [ ] `sentry.client.config.ts`
- [ ] `sentry.server.config.ts`
- [ ] `sentry.edge.config.ts`

## Documentation
- [x] `docs/BRIEF.md`
- [x] `docs/architecture.md`
- [x] `docs/architecture-review.md`
- [x] `docs/deliverables-checklist.md` — this file

## Public Assets
- [ ] `public/favicon.svg`
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
- [ ] `src/app/layout.tsx`
- [ ] `src/app/page.tsx` — the scene page
- [ ] `src/app/globals.css`
- [ ] `src/app/opengraph-image.tsx` — pre-rendered evening hero
- [ ] `src/app/fallback/page.tsx` — no-JS semantic portfolio
- [ ] `src/app/api/health/route.ts` — GitHub connectivity smoke test
- [ ] `src/app/api/revalidate/route.ts` — authenticated ISR webhook

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
- [ ] `src/content/profile.ts` — name, role, city, github username (seeded placeholder in P1, real content later)
- [ ] `src/content/projects/index.ts` — ordered array
- [ ] `src/content/projects/schemas.ts` — Zod `Project` schema
- [ ] `src/content/projects/<slug>.ts` — one module per project (≥1 placeholder in P1, ≥1 real in P4)
- [ ] `src/content/skills/index.ts`
- [ ] `src/content/skills/schemas.ts` — Zod `Skill` schema
- [ ] `src/content/skills/<slug>.ts` — per-skill modules (≥1 placeholder in P1)
- [ ] `src/content/experience/index.ts`
- [ ] `src/content/experience/schemas.ts` — Zod `ExperienceEntry` schema
- [ ] `src/content/experience/<slug>.ts` — per-role modules

## GitHub Data Layer
- [ ] `src/data/github/client.ts` — server-only GraphQL fetcher (`import 'server-only'`)
- [ ] `src/data/github/queries.ts` — `UserContributions` + `UserActivity` documents
- [ ] `src/data/github/types.ts` — GraphQL response types
- [ ] `src/data/github/transform.ts` — includes `quantize()` (Section 5.3)
- [ ] `src/data/github/cache.ts` — ISR revalidate tags + ttl factory
- [ ] `src/data/loaders/projects.ts` — typed loader over `content/` (projects/skills/experience/profile)

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
- [ ] `src/telemetry/events.ts` — typed custom event names + `track()`
- [ ] `src/telemetry/web-vitals.ts` — Next.js web-vitals reporter

## Styles
- [ ] `src/styles/tokens.css` — accent color + type tokens

## Lib
- [ ] `src/lib/env.ts` — zod-validated env access
- [ ] `src/lib/logger.ts` — pino-based server logger

## Scripts
- [ ] `scripts/asset-pipeline/compress-geometry.mjs` — Draco via `@gltf-transform`
- [ ] `scripts/asset-pipeline/compress-textures.mjs` — KTX2/Basis via `@gltf-transform`
- [ ] `scripts/asset-pipeline/verify-budgets.mjs` — fails CI if scene assets > 15MB
- [ ] `scripts/bake-lightmaps.md` — Blender workflow reference

## Tests — Unit (Vitest)
- [ ] `tests/unit/time-of-day.test.ts` — resolve()/override cases
- [ ] `tests/unit/github-transform.test.ts` — quantize() + GraphQL fixture contract
- [ ] `tests/unit/content-schemas.test.ts` — every content module parses
- [ ] `tests/unit/env.test.ts` — env zod validation

## Tests — Component (Vitest + RTL)
- [ ] `tests/component/ProjectPanel.test.tsx`
- [ ] `tests/component/IntroOverlay.test.tsx`
- [ ] `tests/component/SealedProjectPanel.test.tsx` — NDA field redaction

## Tests — E2E (Playwright)
- [ ] `tests/e2e/fixtures/github-mock.ts` — mocked GraphQL fixture
- [ ] `tests/e2e/scene-load.spec.ts`
- [ ] `tests/e2e/project-book-open.spec.ts` — open→scroll→close + focus restoration
- [ ] `tests/e2e/time-of-day-override.spec.ts` — four `?time=` states
- [ ] `tests/e2e/keyboard-nav.spec.ts` — tab order stability
- [ ] `tests/e2e/reduced-motion.spec.ts` — startup + ambient damping
- [ ] `tests/e2e/fallback.spec.ts` — no-JS meta-refresh to `/fallback`
- [ ] `tests/e2e/visual/hero-states.spec.ts` — screenshot-per-state regression
- [ ] `tests/e2e/visual/baseline/` — committed baseline PNGs per state

## Performance Gates (live in CI)
- [ ] Bundle-size guard — parses `next build` report, fails >1MB gzipped
- [ ] Lighthouse CI on preview deploys — night-state perf ≥ 80 desktop, LCP < 2.5s, CLS < 0.1
- [ ] Playwright perf harness — p5 frame rate ≥ 55fps per state during 10s idle

## CI/CD
- [ ] `.github/workflows/ci.yml` — typecheck, lint, unit, e2e, asset budget, Lighthouse, bundle-size
- [ ] `.github/workflows/visual-regression.yml` — screenshot diff on preview deploys

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
