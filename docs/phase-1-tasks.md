# Phase 1 Tasks — Foundation

**Goal.** Scaffold the Next.js app, prove the GitHub data pipeline end-to-end on a minimal debug page, and install every piece of tooling later phases rely on.

**Acceptance Test (from Section 8).**
- `pnpm dev` loads `http://localhost:3000/`.
- Page shows the visitor's real GitHub contribution count for the last 90 days as a text value rendered from server-fetched data.
- The page's raw HTML (verified via `curl -sH 'accept: text/html'`) contains the contribution total — proving the data is server-rendered, not client-fetched.
- `curl /api/health` returns `{ "ok": true, "github": "reachable", "version": "<git sha>", "builtAt": "..." }`.
- `pnpm test`, `pnpm e2e`, `pnpm lint`, `pnpm typecheck`, and `pnpm assets:verify` all pass locally and in CI.

**Architecture Doc References:** Sections 1, 2, 3 (ADR-001, -004, -006, -008, -011, -012, -013, -015), 4.1–4.2, 5.2, 5.3, 5.10, 7.1–7.5, 8 (Phase 1), 9.1, 11.1–11.2.

**Previous Phase Review:** N/A — first phase.

**Architecture-Review Hooks (for context).** The pre-implementation review in `docs/architecture-review.md` flagged the following items for Phase 1 attention:
- CSP header policy in `next.config.mjs` (Section 7 reviewer note). **Included below as P1-24.**
- Node 20.x vs. 22 LTS — architecture stays on 20.x unless the developer overrides; captured in `.nvmrc` task.
- Bundle-size guard — initial CI gate lands here, not in Phase 5.
- `axe-playwright` — architecture places it in Phase 5; not in scope for Phase 1.

**Open Assumptions Carried Into Implementation.** These are the answers the review asked to lock. If any is wrong, surface during implementation and file a deviation — do not silently diverge.
- ISR revalidate = 3600s (1h). Reflected in `cache.ts` default and `/api/revalidate` behavior.
- GitHub PAT scope = `read:user`. Private-repo inclusion is a post-V1 decision.
- Visitor sees **the developer's** timezone for contribution dates (single shared cache).
- Fallback route strategy = `<noscript>` meta-refresh from `/` → `/fallback`. The meta tag is authored in layout head in Phase 5; Phase 1 only needs the `/fallback` route shell.
- Accent color = single deploy-time hex, defined in `src/styles/tokens.css` when Phase 2 lands. Not used in Phase 1.

**Phase 1 Out-of-Scope (deferred on purpose).** No scene (Canvas/R3F), no UI panels, no stores, no time-of-day resolver, no interaction layer, no Sentry session replay, no visual-regression CI, no Lighthouse CI, no shadcn component generation beyond `init`, no `opengraph-image.tsx`, no scene assets, no fonts under `public/fonts/` (Phase 2/5), no `time-of-day/*` files, no `scene/*` files.

---

## Tasks

### P1-01: Project scaffold — Next.js 15, pnpm, Node pin, .gitignore, README, LICENSE

**Service:** Root configuration.

**Files:**
- `package.json` (with `"packageManager": "pnpm@9.x"` and V1 scripts: `dev`, `build`, `start`, `lint`, `typecheck`, `test`, `e2e`, `assets:verify`)
- `pnpm-lock.yaml` (generated)
- `next.config.mjs` (empty scaffold — CSP added in P1-24)
- `.nvmrc` — `20`
- `.gitignore` (Next.js standard + `.env.local`, `.vercel`, `tests/e2e/visual/baseline/*.png` left tracked per ADR-011)
- `.env.example` with keys: `GITHUB_PAT=`, `GITHUB_USERNAME=`, `NEXT_PUBLIC_SENTRY_DSN=`, `SENTRY_AUTH_TOKEN=`, `REVALIDATE_SECRET=`, `LOG_LEVEL=info`
- `README.md` — short product-first intro + local-dev quickstart (full README from Section 10.1 is Phase 5; this is the skeleton)
- `LICENSE` — MIT for code, with a plain-English note that `docs/` content and `public/` assets are all-rights-reserved.

**Dependencies:** None.

**Acceptance Criteria:**
- `pnpm install` succeeds on a clean clone using Node 20.x.
- `pnpm dev` starts Next.js on `:3000` with the default Next.js App Router welcome (before P1-16 replaces it).
- `corepack enable && corepack use pnpm@9` works; npm/yarn install is blocked by `preinstall` script printing an error.
- `README.md` includes the `cp .env.example .env.local` step.

**Architecture Context:**
- ADR-001: Next.js 15.x App Router on Vercel, Node 20.x runtime.
- ADR-013: pnpm 9.x, `packageManager` pinned, Corepack enabled, `preinstall` script enforcing pnpm.
- Section 10.3: `cp .env.example .env.local` is the canonical first-run step — fill in `GITHUB_PAT` and `GITHUB_USERNAME`.
- Directory structure per Section 2: single app, no workspaces.

---

### P1-02: TypeScript config with path aliases

**Service:** Root configuration.

**Files:**
- `tsconfig.json`

**Dependencies:** P1-01.

**Acceptance Criteria:**
- `strict: true`, `moduleResolution: "bundler"`, `jsx: "preserve"`, Next.js `plugins: [{ "name": "next" }]`.
- Path alias `@/*` → `./src/*` resolves in both `tsc --noEmit` and Next.js dev.
- `pnpm typecheck` script runs `tsc --noEmit` and exits 0 on the scaffold.
- `include` covers `src/**/*`, `tests/**/*`, `scripts/**/*`, `next-env.d.ts`, `instrumentation.ts`, `sentry.*.config.ts`.

**Architecture Context:** Tests and unit code in the architecture doc (Section 9.1) use `@/...` imports (e.g. `@/time-of-day/resolve`, `@/data/github/transform`, `@/content/projects/schemas`). The alias must exist from day one.

---

### P1-03: Tailwind v4 + shadcn/ui init + globals.css

**Service:** Styling/UI foundation.

**Files:**
- `tailwind.config.ts` (minimal — content globs only; tokens live in CSS per ADR-007)
- `postcss.config.mjs`
- `components.json` (shadcn/ui config, base color = neutral, `@/ui/primitives` as components dir, `@/lib/utils.ts` for the `cn()` helper)
- `src/app/globals.css` — imports Tailwind v4, sets base `html`/`body` resets
- `src/lib/utils.ts` — `cn(...inputs)` helper for shadcn (clsx + tailwind-merge)
- `public/favicon.svg` — minimal placeholder (single-letter "A" monogram, accent-less)

**Dependencies:** P1-01, P1-02.

**Acceptance Criteria:**
- `pnpm dev` serves Tailwind utilities (verified by adding a `className="text-sm text-neutral-500"` smoke to the default page and confirming computed styles).
- `npx shadcn@latest init` (or equivalent) has been run non-interactively; `components.json` is committed.
- **No shadcn primitives are generated in P1** — `src/ui/primitives/` is empty or does not exist yet. `button.tsx`/`dialog.tsx` ship in Phase 4 when panels are built.
- No `AccentProvider` or `tokens.css` yet — those are Phase 2 deliverables; this task only wires the engine.

**Architecture Context:** ADR-007 — shadcn/ui + Tailwind v4 + Framer Motion. Tailwind v4's CSS-first config means token definitions go in `src/styles/tokens.css` (Phase 2), not `tailwind.config.ts`. The Tailwind v4 engine needs `@import "tailwindcss";` at the top of `globals.css`.

---

### P1-04: ESLint + Prettier

**Service:** Root configuration.

**Files:**
- `eslint.config.mjs` (flat config, extends Next.js core-web-vitals + TypeScript rules; **no** `import/no-internal-modules` rules that would block `@/` aliases)
- `.prettierrc` — 2-space indent, single quotes, trailing commas `all`, 80-col print width.
- `package.json` scripts: `lint` → `next lint`, `format` → `prettier --write .`

**Dependencies:** P1-01, P1-02.

**Acceptance Criteria:**
- `pnpm lint` exits 0 on the scaffold.
- Prettier + ESLint do not fight each other (eslint-config-prettier is applied last).
- VS Code's default setup respects `.prettierrc` (no project-specific IDE config committed).

**Architecture Context:** No ADR dedicated to linting; the project inherits Next.js's shipped ESLint config. Rules like React hooks, a11y basics, and Next.js route-file constraints are essential. The config must not raise errors on patterns the architecture already prescribes (named default exports from route files, `import 'server-only'`, etc.).

---

### P1-05: `src/lib/env.ts` — Zod-validated env access

**Service:** lib.

**Files:**
- `src/lib/env.ts`

**Dependencies:** P1-02.

**Acceptance Criteria:**
- Exports a single `env` object, type-inferred from a Zod schema, with:
  - `GITHUB_PAT: z.string().min(1)` (server-only)
  - `GITHUB_USERNAME: z.string().min(1)`
  - `REVALIDATE_SECRET: z.string().min(1)` (server-only)
  - `NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional()`
  - `SENTRY_AUTH_TOKEN: z.string().optional()` (server-only, CI uploads)
  - `LOG_LEVEL: z.enum(['fatal','error','warn','info','debug','trace']).default('info')`
  - `VERCEL_ENV: z.enum(['production','preview','development']).default('development')`
- Parsing failures throw a single aggregated error on first import; caller (server components / API routes) sees a clear message.
- File has `import 'server-only'` at the top for the *server* env object. If a `NEXT_PUBLIC_*`-only subset is needed by client code, expose it via a separate `clientEnv` export that imports no server-only secrets. For Phase 1 the client subset is just `NEXT_PUBLIC_SENTRY_DSN` (or empty — keep minimal).
- `tests/unit/env.test.ts` covers: happy path parse, missing-required-key failure, invalid-log-level failure.

**Architecture Context:** Section 7.1 lists the canonical env vars. The `.env.example` file authored in P1-01 must mirror this schema exactly. The file becomes the single import surface for any code reading env — no `process.env.X` access outside `lib/env.ts`.

---

### P1-06: `src/lib/logger.ts` — pino with structured bindings

**Service:** lib.

**Files:**
- `src/lib/logger.ts`

**Dependencies:** P1-05.

**Acceptance Criteria:**
- Exports `logger` (pino instance) with base bindings `{ app: 'atelier', env: process.env.VERCEL_ENV ?? 'local' }`.
- ISO timestamps (`pino.stdTimeFunctions.isoTime`).
- Log level pulled from `env.LOG_LEVEL`.
- Exports a `withReqId(reqId: string): Logger` helper that returns a child logger with `reqId` bound.
- `import 'server-only'` at the top.
- Example log line matches the shape in Section 7.3.

**Architecture Context:** Section 7.3 dictates the exact log line shape. `reqId` is pulled from the `x-vercel-id` header (via `headers()` in App Router) or a fresh UUID. This task ships the *pattern*; API routes wire the per-request binding starting in P1-18/P1-19.

This is also the Phase 1 establishment of **structured JSON logging with correlation IDs** — a cross-cutting expectation every future phase inherits.

---

### P1-07: Sentry install — instrumentation + client/server/edge configs

**Service:** Telemetry.

**Files:**
- `instrumentation.ts` (Next.js Sentry init hook; calls `Sentry.init()` from the right config based on `runtime`)
- `sentry.client.config.ts` — `replaysSessionSampleRate: 0.0`, `tracesSampleRate: 0.1` in prod / `1.0` in preview
- `sentry.server.config.ts`
- `sentry.edge.config.ts`

**Dependencies:** P1-01, P1-05.

**Acceptance Criteria:**
- `@sentry/nextjs` installed and wired via `withSentryConfig` in `next.config.mjs` (P1-24 owns the CSP bits of that file; Sentry plugin integration is added here).
- `NEXT_PUBLIC_SENTRY_DSN` absent → Sentry init is a no-op (never throws at boot; logs a pino `warn` via `lib/logger` on the server).
- No session replay (portfolio-grade privacy, per ADR-012).
- Source-map upload is gated on `SENTRY_AUTH_TOKEN` being present (preview/prod builds in CI only).
- `pnpm dev` and `pnpm build` both succeed with and without the DSN set.

**Architecture Context:** ADR-012. Section 5.10 module structure. `replaysSessionSampleRate: 0.0` is explicitly specified — this is a portfolio, not an app. Traces sampling is 10% prod / 100% preview.

---

### P1-08: Vercel Analytics + `src/telemetry/{events,web-vitals}.ts`

**Service:** Telemetry.

**Files:**
- `src/telemetry/events.ts`
- `src/telemetry/web-vitals.ts`

**Dependencies:** P1-05. (Analytics component is mounted inside the layout task, P1-15.)

**Acceptance Criteria:**
- `src/telemetry/events.ts` exports the `Event` discriminated union from Section 5.10 (**unchanged verbatim**) and a `track(event: Event): void` function. Implementation in Phase 1 forwards to `window.dataLayer`-style noop + a Sentry breadcrumb; exact transport is Section 7.2 (Vercel + Sentry). Safe to call from SSR — becomes a no-op.
- `src/telemetry/web-vitals.ts` exports a `WebVitalsReporter` React component that uses Next.js's `useReportWebVitals` and forwards to `@vercel/analytics`.
- Unit test (`tests/unit/telemetry.test.ts` — optional, but light smoke recommended) covers `track()` being a no-op when `window` is undefined.

**Architecture Context:** Section 5.10 pins the event catalog; do not add new event names in Phase 1 beyond those listed. `track()` should tolerate unknown environments gracefully — the build must not fail in a non-browser runtime.

---

### P1-09: Content Zod schemas — projects, skills, experience

**Service:** Content layer.

**Files:**
- `src/content/projects/schemas.ts`
- `src/content/skills/schemas.ts`
- `src/content/experience/schemas.ts`

**Dependencies:** P1-02.

**Acceptance Criteria:**
- Each schema file exports the Zod object and a `z.infer<>`-derived TS type.
- `Project`, `ProjectVisibility`, `Skill`, `SkillCategory`, `ExperienceEntry` shapes match Section 4.2 **verbatim** (field names, enum values, optional vs. required, defaults).
- Schemas are pure — no runtime imports beyond `zod`.

**Architecture Context:** Section 4.2 is the source of truth for every field. ADR-006 mandates boot-time validation; these schemas are the boundary. Do not add speculative fields ("client-facing tagline", "featured flag") — only what Section 4.2 lists.

---

### P1-10: Seed content + loaders

**Service:** Content layer.

**Files:**
- `src/content/profile.ts` — placeholder `Profile` satisfying the TS interface from Section 4.2 (e.g., `name: 'Atelier Placeholder'`, `githubUsername: <your username from env>` — hard-coded here, real swap in Phase 5)
- `src/content/projects/index.ts` — `export default [placeholderProject]`
- `src/content/projects/placeholder.ts` — one full `Project` with `visibility: 'public'` and filler text
- `src/content/skills/index.ts` — `export default [placeholderSkill]`
- `src/content/skills/placeholder.ts` — one filler `Skill`
- `src/content/experience/index.ts` — `export default []` (empty array; real entries land Phase 5)
- `src/data/loaders/projects.ts` — exports `loadProfile`, `loadProjects`, `loadSkills`, `loadExperience`; each runs `.parse()` and throws loudly on failure.
- `tests/unit/content-schemas.test.ts` — iterates every content module via loaders and asserts `.parse()` does not throw.

**Dependencies:** P1-09.

**Acceptance Criteria:**
- `loadProjects()` etc. return validated arrays; TS types flow through.
- The unit test fails if the placeholder project is mutated into an invalid shape.
- `profile.ts`'s `githubUsername` is the same value the GitHub client will be asked to fetch — Phase 1's acceptance test requires a live contribution total, so this must be a real username that exists on GitHub.

**Architecture Context:** ADR-006. Section 5.2 interface for `loadProjects/Skills/Experience/Profile`. `profile.ts` uses a plain TS interface (Section 4.2 defines it as `interface Profile` not a Zod schema); only the `projects`/`skills`/`experience` use Zod.

**Deviation note to future phases:** The content module files are deliberately `placeholder.ts`, not a real slug. Phase 4 owns inserting the first real project file; Phase 5 owns the rest.

---

### P1-11: GitHub data layer — types, queries, cache factory

**Service:** GitHub data layer.

**Files:**
- `src/data/github/types.ts`
- `src/data/github/queries.ts`
- `src/data/github/cache.ts`

**Dependencies:** P1-02, P1-05.

**Acceptance Criteria:**
- `types.ts` exports `ContributionDay`, `ActivityEvent`, `GithubSnapshot` exactly per Section 4.2, plus narrowly-typed GraphQL response shapes (`UserContributionsResponse`, `UserActivityResponse`) used by the client.
- `queries.ts` exports two tagged GraphQL document strings:
  - `UserContributions` — reads `user(login: $login).contributionsCollection.contributionCalendar` with `from`/`to` inputs for a 90-day window.
  - `UserActivity` — reads recent `pullRequests`, `issues`, top `repositories(orderBy: STARGAZERS)`, and `releases` on top repos. **Commit-level events are excluded** (architecture-review Assumption #8 flagged them as noisy; Phase 3 decides).
- `cache.ts` exports a `githubFetchOptions(tag: string, revalidateSec = 3600)` helper returning the `{ next: { tags: [tag], revalidate } }` shape passed into `fetch()` so the client stays declarative.
- `cache.ts` also exports the constant `GITHUB_ACTIVITY_TAG = 'github-activity'`.

**Architecture Context:** ADR-004, Section 5.3, Section 11.2. The 1-hour revalidate is pulled from Section 7.1. Cache tag `github-activity` is the only tag in V1; adding more is an explicit future decision.

---

### P1-12: GitHub data layer — client + transform (with `quantize`)

**Service:** GitHub data layer.

**Files:**
- `src/data/github/client.ts`
- `src/data/github/transform.ts`

**Dependencies:** P1-11, P1-06.

**Acceptance Criteria:**
- `client.ts` exports `fetchGithubSnapshot(username: string): Promise<GithubSnapshot>`.
  - Top of file has `import 'server-only'`.
  - Uses native `fetch` with `githubFetchOptions(GITHUB_ACTIVITY_TAG, 3600)`.
  - `Authorization: bearer ${env.GITHUB_PAT}`.
  - Non-2xx response or network failure throws a custom `GithubFetchError` exported from this file, with `status`, `reason`, and `cause` set; the error is logged via `logger` at `error` level with `{ err }` binding.
  - Exponential-backoff retry is **not** required in Phase 1 (architecture-review flagged it as future work); a single attempt is acceptable. Flag this as a deviation noted here.
- `transform.ts` exports:
  - `quantize(counts: number[]): (0|1|2|3|4)[]` — verbatim algorithm from Section 5.3.
  - `toContributionDays(resp: UserContributionsResponse): ContributionDay[]` — flattens the calendar weeks, sorts by date ascending, trims to last 90 days, fills gaps with zero-count days.
  - `toActivityEvents(resp: UserActivityResponse): ActivityEvent[]` — merges PRs/issues/releases into `ActivityEvent[]`, sorts newest-first, caps at ~30 entries.
- `tests/unit/github-transform.test.ts` exercises `quantize` per the Section 9.1 example plus one test that `toContributionDays` fills a missing day with `count: 0, level: 0`.
- Committed `tests/unit/fixtures/github-contributions.json` drives the contract test. Regeneration flow documented via `ATELIER_REFRESH_FIXTURES=1` env var comment (Section 9.4).

**Architecture Context:** Section 5.3 gives `quantize` verbatim — **copy-paste, do not reinvent the algorithm**. The timezone assumption is "developer's timezone" (architecture-review clarification #5). `ActivityEvent.id` must be stable-derived — use `<kind>:<repo>:<at>` as the composition rule so identity is reproducible across cache regenerations.

---

### P1-13: `src/app/api/health/route.ts`

**Service:** API routes.

**Files:**
- `src/app/api/health/route.ts`

**Dependencies:** P1-12.

**Acceptance Criteria:**
- `GET` handler returns JSON per Section 7.4:
  ```json
  { "ok": true, "github": "reachable", "version": "<git sha>", "builtAt": "..." }
  ```
- Probes GitHub with a minimal query `{ viewer { login } }` (or reuses `fetchGithubSnapshot` with a short-circuit). On failure, returns `{ ok: false, github: "unreachable", ... }` with HTTP 503 and logs the error.
- Probe response cached **60s** (separate tag: `github-health`) to avoid rate pressure.
- `version` comes from `process.env.VERCEL_GIT_COMMIT_SHA ?? 'local'`; `builtAt` from `process.env.VERCEL_GIT_COMMIT_SHA`-adjacent build timestamp or a build-time const — an ISO string is fine.
- Uses `logger.child({ reqId })` where `reqId` comes from the incoming `x-vercel-id` header.

**Architecture Context:** Section 7.4 specifies the exact response shape and that uptime monitoring will scrape this route.

---

### P1-14: `src/app/api/revalidate/route.ts`

**Service:** API routes.

**Files:**
- `src/app/api/revalidate/route.ts`

**Dependencies:** P1-11, P1-05.

**Acceptance Criteria:**
- `POST` handler reads JSON body `{ secret: string, tag?: string }`.
- Rejects with 401 if `secret !== env.REVALIDATE_SECRET`.
- Defaults `tag` to `GITHUB_ACTIVITY_TAG`; refuses any tag not in a tight allowlist (just `github-activity` and `github-health` in V1) — responds 400 otherwise.
- Calls `revalidateTag(tag)` from `next/cache` and returns `{ revalidated: true, tag }`.
- Logs the call (pino) with `reqId` and the tag.

**Architecture Context:** ADR-004. Section 11.2 (manual-refresh lane). Defense-in-depth: tag allowlist prevents a leaked secret from busting arbitrary cache scopes in the future.

---

### P1-15: `src/app/layout.tsx` + `not-found.tsx` + Analytics mount

**Service:** App shell.

**Files:**
- `src/app/layout.tsx`
- `src/app/not-found.tsx` (minimal "Not found — return home" page)

**Dependencies:** P1-03, P1-07, P1-08.

**Acceptance Criteria:**
- Root `<html>` + `<body>` with `suppressHydrationWarning` only if actually needed (don't add speculatively).
- Imports `globals.css`.
- Mounts `<Analytics />` from `@vercel/analytics/react` and the `WebVitalsReporter` from P1-08.
- Sentry is wired automatically via `instrumentation.ts`; no manual layout integration required.
- No `<noscript>` meta-refresh to `/fallback` yet — that's Phase 5 when the fallback is fully styled. Phase 1's layout has a plain `<noscript>You need JavaScript to view the interactive scene. Visit /fallback for the text version.</noscript>` that links the text route.
- `not-found.tsx` is a semantic 404 page — pure HTML, no 3D.
- Default `metadata` export provides title + description pulled from `loadProfile()`.

**Architecture Context:** Section 2 (directory structure), ADR-012 (Analytics mount point), ADR-015 (no-JS strategy — linked, not fully activated in P1).

---

### P1-16: `src/app/page.tsx` — server-fetched debug page

**Service:** App shell.

**Files:**
- `src/app/page.tsx`

**Dependencies:** P1-10, P1-12, P1-15.

**Acceptance Criteria:**
- Server component (no `'use client'`).
- Calls `loadProfile()` and `fetchGithubSnapshot(profile.githubUsername)` in parallel.
- On success, renders:
  - `<h1>` with `profile.name` + `profile.role`.
  - A **visible text span** with the computed total contribution count over the last 90 days — must be a plain text node in HTML so `curl` can grep for it. Include a stable data attribute: `<span data-testid="contribution-total">{total}</span>`.
  - A `<pre>` with `JSON.stringify(snapshot, null, 2)` below for debug visibility.
- On `GithubFetchError`, renders an in-character error string and a `<pre>` with `{ error: err.message }`. The acceptance test allows this path to fail the "contribution total in HTML" assertion, so local dev must have a valid PAT for acceptance; document this in the README.
- No React Three Fiber, no Canvas, no client-side interactivity — this is the *data proof* page, not the scene.

**Architecture Context:** Section 8 Phase 1 Deliverable 16: "renders a single `<pre>` showing the raw `GithubSnapshot` fetched server-side, plus rendered `Profile`." The exact wording ("single `<pre>`") is satisfied by the JSON dump; the contribution-total `<span>` is an addition so the Playwright and curl acceptance tests have a stable selector/substring to grep.

---

### P1-17: `src/app/fallback/page.tsx` — minimal semantic page

**Service:** App shell.

**Files:**
- `src/app/fallback/page.tsx`

**Dependencies:** P1-10, P1-12.

**Acceptance Criteria:**
- Server component.
- Renders `<main>` with semantic headings for: profile (name, role, city), one projects `<section>` listing titles (from `loadProjects()`), one skills `<section>`, and a final `<section>` showing the GitHub contribution total (same number as `/`).
- **No Tailwind styling beyond browser defaults** — Phase 5 owns the full styled fallback. Section 8's Phase 1 deliverable 17 is explicit: "minimal semantic page (full styling comes in Phase 5)."
- Accessible headings, `<nav>` with skip-to-content, `<a>` links to each section.

**Architecture Context:** ADR-015. Phase 1 delivers the route; Phase 5 delivers the styled experience. Don't over-invest here.

---

### P1-18: Vitest + RTL config + unit tests

**Service:** Testing harness.

**Files:**
- `vitest.config.ts`
- `tests/unit/env.test.ts` (owned by P1-05 — re-counted here as harness wiring)
- `tests/unit/github-transform.test.ts` (owned by P1-12 — re-counted here)
- `tests/unit/content-schemas.test.ts` (owned by P1-10 — re-counted here)
- `tests/setup.ts` (RTL + jest-dom extensions; global fetch mock hook)
- `package.json` script: `test` → `vitest run`, `test:watch` → `vitest`

**Dependencies:** P1-02, P1-05, P1-10, P1-12.

**Acceptance Criteria:**
- `pnpm test` runs all unit tests against real modules (no component tests yet — those ship in Phase 4).
- Vitest config declares `resolve.alias` matching the tsconfig `@/*` alias.
- Environment: `node` for unit, `happy-dom` or `jsdom` only where component tests will eventually live (prepare the config but don't need to flip files over yet).
- Zero failures on the P1 code paths.

**Architecture Context:** ADR-011. Section 9.1 shows the unit test authoring style — follow it verbatim for the three listed files.

---

### P1-19: Playwright config + smoke e2e

**Service:** Testing harness.

**Files:**
- `playwright.config.ts`
- `tests/e2e/scene-load.spec.ts` — Phase 1 scope: asserts that `/` returns 200 and HTML contains a non-empty `data-testid="contribution-total"` node with a numeric value. This spec evolves in Phase 2 to actually verify the scene mount.
- `package.json` script: `e2e` → `playwright test`

**Dependencies:** P1-16.

**Acceptance Criteria:**
- `pnpm e2e` boots the dev server (Playwright `webServer` config → `pnpm dev`), runs the single spec, passes on chromium.
- The spec uses a real fetch — no GraphQL mocking fixture yet (that ships in Phase 3 at `tests/e2e/fixtures/github-mock.ts`). Phase 1 relies on the real PAT being set locally and in CI via a secret.
- If `GITHUB_PAT` is absent, Playwright skips the contribution assertion with a clear `test.skip()` message so CI forks without the secret still go green.

**Architecture Context:** ADR-011. Section 9.3 lists the full e2e suite; Phase 1 only carves out the smoke spec. The `github-mock` fixture path is reserved for Phase 3.

**Deviation note:** The architecture doc's Phase 3 test listing mentions `tests/e2e/fixtures/github-mock.ts` — Phase 1 deliberately does not create it. Phase 3's task file will own that creation.

---

### P1-20: Asset pipeline scripts + `pnpm assets:verify`

**Service:** Asset pipeline.

**Files:**
- `scripts/asset-pipeline/compress-geometry.mjs`
- `scripts/asset-pipeline/compress-textures.mjs`
- `scripts/asset-pipeline/verify-budgets.mjs`
- `package.json` scripts: `assets:build` → runs compress-geometry then compress-textures; `assets:verify` → runs verify-budgets.

**Dependencies:** P1-01.

**Acceptance Criteria:**
- `pnpm assets:verify` exits 0 when `public/scene/` is empty or missing (Phase 1 has no scene assets yet). It counts bytes under `public/scene/` and fails only if the sum **plus one lightmap** would exceed 15MB — with zero assets, always passes.
- `compress-geometry.mjs` is a thin wrapper around `@gltf-transform/cli` Draco compression; it is **not executed in Phase 1 CI** (no geometry exists yet) but must be importable / runnable without errors against a zero-file glob.
- `compress-textures.mjs` same: classifies by channel (UASTC for normals, ETC1S for albedo) and no-ops cleanly when no textures exist.
- `verify-budgets.mjs` emits a structured log line (JSON) with the final size + budget for CI trace visibility.

**Architecture Context:** ADR-010, Section 5.9, Section 7.5. The `verify-budgets` script is **CI-blocking from Phase 1** (per Risks table: "Asset budget creep past 15MB — `verify-budgets.mjs` is CI-blocking from Phase 1"). Implementing it now means Phase 2's asset additions trip the budget gate immediately.

---

### P1-21: `.github/workflows/ci.yml`

**Service:** CI/CD.

**Files:**
- `.github/workflows/ci.yml`

**Dependencies:** P1-01, P1-04, P1-18, P1-19, P1-20.

**Acceptance Criteria:**
- Runs on `push` to any branch + `pull_request` to `main`.
- Node 20.x via `actions/setup-node`, pnpm via `pnpm/action-setup`, caching `.pnpm-store`.
- Jobs (all on `ubuntu-latest`):
  - `typecheck` → `pnpm typecheck`
  - `lint` → `pnpm lint`
  - `unit` → `pnpm test`
  - `e2e` → `pnpm exec playwright install chromium && pnpm e2e` (uses `GITHUB_PAT` from repo secrets)
  - `assets-verify` → `pnpm assets:verify`
  - `bundle-size` → `pnpm build && node scripts/asset-pipeline/verify-bundle-size.mjs` (**new script bundled with P1-20 above** — parses `.next/build-manifest.json` + route-level JS sizes; fails if any route's gzipped JS > 1MB per Section 7.5)
- Lighthouse CI, visual-regression, and `axe-playwright` are **not** in Phase 1 — they ship with Phase 5's `visual-regression.yml` + Lighthouse gate additions.

**Architecture Context:** Section 7.5 performance gate table — the initial JS bundle gate (<1MB gzipped) belongs to Phase 1 CI. Lighthouse perf gate belongs to Phase 5. The scene-asset gate rides along from P1-20.

**Deviation note:** The architecture doc's "bundle-size guard" is listed in the Phase 5 deliverables column but Section 7.5 describes it generally. Landing it in Phase 1 catches drift early and matches the review's implicit preference; update the deliverables checklist to reflect completion in Phase 1 rather than Phase 5.

---

### P1-22: Content Security Policy + security headers in `next.config.mjs`

**Service:** Root configuration.

**Files:**
- `next.config.mjs` (adds `headers()` export returning CSP + `Permissions-Policy` + `Referrer-Policy`)

**Dependencies:** P1-01, P1-07.

**Acceptance Criteria:**
- CSP includes:
  - `default-src 'self'`
  - `script-src 'self' 'unsafe-inline' https://vercel.live` (Tailwind v4 + Sentry + shadcn may need inline; `'unsafe-inline'` is the minimum cost — Phase 5 tightens with hashes once the surface stabilizes)
  - `style-src 'self' 'unsafe-inline'` (shadcn + Tailwind + Framer Motion inject inline styles)
  - `img-src 'self' data: https://*.githubusercontent.com` (GitHub avatars)
  - `connect-src 'self' https://api.github.com https://*.vercel-insights.com https://*.sentry.io`
  - `frame-ancestors 'none'`
  - `worker-src 'self' blob:` (KTX2 decoder worker, MediaPipe WASM post-V1)
- `Permissions-Policy: camera=(self)` so the Phase 5 webcam gate can request access; no other permissions delegated.
- `Referrer-Policy: strict-origin-when-cross-origin`.
- CSP does **not** break any current route — verified by loading `/`, `/fallback`, `/api/health` in dev and confirming no console CSP violations.

**Architecture Context:** Architecture-review Section 7 reviewer note: "Missing: CSP. A Content-Security-Policy for the site is worth adding in `next.config.mjs`, given MediaPipe loads WASM and shadcn uses inline styles. Flagged for a Phase 1 deliverable addition." This task honors that recommendation.

**Deviation note:** CSP is **not** listed in architecture.md Section 8 Phase 1 deliverables — it's a review addition. Update `docs/deliverables-checklist.md` to reflect it.

---

## Checklist Cross-Reference

Mapping each Phase 1 deliverable from Section 8 and each unchecked item in `docs/deliverables-checklist.md` to the tasks above:

**Section 8 Phase 1 deliverables:**

| # | Deliverable | Task(s) |
|---|---|---|
| 1 | Next.js 15 + App Router + TS + Tailwind v4 + shadcn init | P1-01, P1-02, P1-03 |
| 2 | pnpm + `packageManager` + `.nvmrc` | P1-01 |
| 3 | `src/lib/env.ts` | P1-05 |
| 4 | Content Zod schemas | P1-09 |
| 5 | `src/content/profile.ts` seed | P1-10 |
| 6 | Placeholder project + skill | P1-10 |
| 7 | GitHub data layer (5 files) | P1-11, P1-12 |
| 8 | `/api/health` + `/api/revalidate` | P1-13, P1-14 |
| 9 | `src/lib/logger.ts` | P1-06 |
| 10 | Sentry + Vercel Analytics | P1-07, P1-08 |
| 11 | `src/telemetry/{events,web-vitals}.ts` | P1-08 |
| 12 | Vitest + RTL + Playwright (one test each) | P1-18, P1-19 |
| 13 | ESLint + Prettier | P1-04 |
| 14 | `.github/workflows/ci.yml` | P1-21 |
| 15 | Asset pipeline scripts | P1-20 |
| 16 | `src/app/page.tsx` | P1-16 |
| 17 | `src/app/fallback/page.tsx` | P1-17 |

**Deliverables-checklist items covered in this phase (summary):**

- Root config: `README`, `LICENSE`, `package.json`, `pnpm-lock.yaml`, `tsconfig.json`, `next.config.mjs`, `tailwind.config.ts`, `postcss.config.mjs`, `vitest.config.ts`, `playwright.config.ts`, `components.json`, `eslint.config.mjs`, `.prettierrc`, `.env.example`, `.gitignore`, `.nvmrc`, `instrumentation.ts`, `sentry.{client,server,edge}.config.ts` — all covered (P1-01 through P1-07, P1-18, P1-19).
- Public assets: `public/favicon.svg` covered (P1-03). Fonts and scene assets deliberately deferred (Phase 2/5).
- App routes: `layout.tsx`, `page.tsx`, `globals.css`, `fallback/page.tsx`, `api/health/route.ts`, `api/revalidate/route.ts` — all covered. `opengraph-image.tsx` is Phase 5.
- Scene subsystem: **None** — Phase 2+.
- Content layer: `profile.ts`, projects `index.ts`/`schemas.ts`/`placeholder.ts`, skills `index.ts`/`schemas.ts`/`placeholder.ts`, experience `index.ts`/`schemas.ts` — all covered. Real project/skill/experience content files land in Phase 4/5.
- GitHub data layer: all 5 files + loaders covered (P1-11, P1-12, P1-10).
- Time-of-day: **None** — Phase 2+.
- Interaction, UI, Stores, Styles: **None** — Phase 2/4.
- Telemetry: `events.ts` + `web-vitals.ts` covered.
- Lib: `env.ts` + `logger.ts` covered.
- Scripts: compress-geometry, compress-textures, verify-budgets covered. `scripts/bake-lightmaps.md` is Phase 5.
- Unit tests: `env.test.ts`, `github-transform.test.ts`, `content-schemas.test.ts` covered. `time-of-day.test.ts` lands in Phase 2 when `resolve.ts` exists.
- Component tests: **None** — Phase 4.
- E2E tests: `scene-load.spec.ts` smoke covered (evolves in Phase 2). All other e2e specs and `fixtures/github-mock.ts` are Phase 2+.
- Perf gates: bundle-size guard covered (P1-21). Lighthouse CI + Playwright perf harness are Phase 5.
- CI/CD: `ci.yml` covered. `visual-regression.yml` is Phase 5.

**Additions beyond Section 8 roadmap (review-recommended):**
- P1-22 (CSP + security headers) — review flagged for Phase 1; update checklist.
- Bundle-size guard lands in Phase 1 CI (reassigned from Phase 5 — see P1-21 deviation note).

**No unchecked items from prior phases** — this is Phase 1.

---

## Summary

- **22 implementation tasks** (P1-01 through P1-22), no catch-up tasks (first phase).
- **Cross-cutting patterns established here:** structured JSON logging with `reqId`, Zod-validated env, typed telemetry event catalog, server-only imports, CI gates (typecheck/lint/unit/e2e/asset-budget/bundle-size).
- **Explicit deviations from architecture.md** (flag at phase-1-review time):
  - Bundle-size guard moved from Phase 5 into Phase 1 CI.
  - CSP + security headers added beyond Section 8 deliverables (review-driven).
  - GitHub client: no retry/backoff in Phase 1; ISR absorbs jitter. Retry policy is deferred to Phase 3 per architecture-review.
  - `page.tsx` adds a `data-testid="contribution-total"` span alongside the `<pre>` so the acceptance test has a stable assertion target.

**Next step after this plan is approved:** Execute with the `phase-execution` skill.
