# Architecture Review — Snapshot

> Pre-implementation review of `docs/architecture.md`. Not updated after
> creation. Capture any decisions the user confirms/changes below as
> edits to the architecture document itself, not here.

## Scope

Review of `architecture.md` v1 produced from `BRIEF.md` and the three
decision batches in the planning conversation (deployment, package
manager, content format, testing, state store, observability).

## Assumptions Made That Should Be Confirmed

1. **Node 20.x runtime.** Vercel-default and widely supported in
   2026-era tooling; if the developer prefers Node 22 LTS, update
   `.nvmrc`, `packageManager` hints, and the `runtime` note in
   `next.config.mjs` before Phase 1 begins.

2. **Vercel region `iad1` (US-East).** Chosen for CDN primacy over
   origin geography, since asset delivery is the dominant latency
   factor. If the target audience is heavily non-US, consider `cdg1`
   or a multi-region preview.

3. **ISR cache TTL = 1 hour.** Brief says "Revalidated … on a 1-hour
   interval." Confirm: 1h is correct? A more frequent refresh is
   achievable but GitHub secondary rate limits become a risk under
   traffic spikes.

4. **Accent color is a single static value per deploy.** Architecture
   assumes the designer picks one accent and it's set in
   `tokens.css`. If the accent should vary per time-of-day state (e.g.
   cooler accent in morning, warmer in evening), ADR-014 needs an
   addendum and `presets.ts` needs accent fields.

5. **Fallback page is a meta-refresh target under no-JS.** This is a
   compromise between SEO (serving `/` directly with indexable
   content) and bundle discipline (keeping the 3D page free of
   fallback content). An alternative is to render the fallback
   content inside `<noscript>` on `/` itself. Both are valid; the
   meta-refresh approach is simpler but makes `/fallback` the canonical
   no-JS URL.

6. **Interactive objects in V1 = project books + live-activity book.**
   Globe and skills catalog are Post-V1 per the brief. Acceptance tests
   in Phase 4 and Phase 5 reflect this. If the developer wants to
   promote the skills catalog into V1, Phase 4 scope expands.

7. **GitHub PAT scope decision is deferred.** Architecture treats
   `read:user` as sufficient for public contribution counts. If the
   developer wants private repo activity counted (the brief mentions
   "bulk of work is in private industry accounts"), the PAT needs
   `repo` scope and the brief's honesty principles need a product
   pass — the current design does not surface private repo names in
   the UI, only aggregate contribution counts.

8. **Event-feed source.** Architecture assumes events come from
   `pullRequests`, `issues`, top `repositories`, and recent `releases`.
   The brief listed "commits" too, but commit-level events are noisy
   via GraphQL. If commits must appear, an additional REST events
   query may be needed — flagged as an open question for Phase 3.

9. **Visual regression baselines will be committed to the repo.** Four
   baseline screenshots (one per state) plus per-phase additions.
   These are binary artifacts. If the developer prefers an external
   baseline store (e.g., Percy, Chromatic), ADR-011 and CI
   configuration need revision.

10. **No CMS, no admin UI.** Content lives in TS modules. Adding a
    project requires a PR. This is ADR-006's intentional choice; if
    the developer ever wants a lower-friction authoring path (e.g.,
    MDX, headless CMS), revisit before content authoring begins at
    scale.

## Sections That May Need More Detail

### 2. Directory structure

- `src/scene/` is dense. If scene composition grows complex in Phase 3
  (live-activity book alone has 4+ files), consider subdividing
  `live-activity/` further (materials, geometry, uniforms, shaders).
- `src/ui/primitives/` is shadcn-owned. Convention should be
  established: generated files are untouched unless a specific style
  diverges.

### 4. Domain model

- **Accent modulation per time-of-day** — not currently in the
  `presets` record. If added, `Project.spine.accent` may want a
  per-state rendering rule.
- **Contribution grid tooltip data** — architecture implies hover
  shows date + count; the brief mentions "that day's activity
  summary," which implies events-per-day. Clarify: should the tooltip
  link contributing events from `events` for that date? Phase 3 will
  need this call.

### 5.3 GitHub data layer

- **Rate limit handling** is only implicit (cache absorbs it). A
  real-world edge case: a viral moment that busts the cache
  repeatedly. Consider adding an exponential backoff + stale-while-
  revalidate policy in `cache.ts`.
- **Timezone for contribution grid** — GitHub's contribution calendar
  is in the viewer's timezone by default for `viewer{}` queries, but
  this query is for a specific `user{}`. Confirm: should "today"
  mean the developer's timezone or the visitor's? Architecture
  currently implies the developer's; a visitor-timezone option exists
  at the cost of different caches per timezone.

### 5.8 Webcam / parallax

- **Performance cost of parallax.** MediaPipe + extra camera animation
  may nudge p5 frame rate below 55fps on slower devices. A kill-switch
  via `prefs.reducedMotion` is specified; a cheaper "device can't keep
  up" auto-disable (frame-rate-threshold watchdog) may be worth
  adding.
- **Permissions UX.** Requesting webcam from an `IntroOverlay` button
  will show a browser permission prompt. Some browsers dim the tab
  while prompting; confirm the intro overlay is state-safe if the
  prompt is dismissed with no action.

### 7. Infrastructure

- **Server-side GitHub fetch failures in ISR.** When a regeneration
  fails, Next.js serves the last-known cached value. Architecture
  assumes this; confirm the ISR config actually sets that behavior
  (there's a `revalidate.isr.onError` pattern worth making explicit
  in `cache.ts`).
- **Missing: CSP.** A Content-Security-Policy for the site is worth
  adding in `next.config.mjs`, given MediaPipe loads WASM and shadcn
  uses inline styles. Flagged for a Phase 1 deliverable addition.

### 8. Roadmap

- **Phase 2 → Phase 3 handoff.** Phase 2 ships an evening-only scene
  with no UI; Phase 3 adds the live-activity book. The book's
  contribution grid emission interacts with the evening lightmap; if
  the grid's emission tuning reveals an issue with the evening
  preset, Phase 2's acceptance baselines may need refresh. Tolerate
  this in practice rather than pre-designing around it.
- **Phase 5 is large.** Four lightmap bakes, startup sequence,
  reduced-motion plumbing, mobile reframe, fallback styling, and perf
  closeout is a lot for one phase. If scope strain emerges, splitting
  it into 5a (time-of-day + startup) and 5b (fallbacks + perf) is
  reasonable.

### 9. Testing

- **No accessibility automated testing called out explicitly.**
  `axe-playwright` integration on the e2e suite would catch common
  ARIA and focus issues. Consider adding as a Phase 5 deliverable.
- **Perf benchmark CI on cold cache.** Lighthouse CI runs on preview
  deploys, where cache is cold. This is the realistic first-visitor
  scenario but may make `LCP < 2.5s` tight. Acceptable; just a
  reality check.

## Risks & Areas of Complexity

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Lightmap baking friction slows iteration | High | Med | Iterate evening only; bake others at phase 5 freeze |
| `<Html transform>` UI doesn't feel "composited" enough | Med | High | Phase 4 acceptance requires visual sign-off; fallback to render-to-texture in worst case |
| State parity — one state looks weaker | High | High | Independent review of each state in Phase 5; no V1 ship until parity |
| Asset budget creep past 15MB | Med | Med | `verify-budgets.mjs` is CI-blocking from Phase 1 |
| MediaPipe + preview deploys break on CI Linux GPU | Med | Low | Webcam is opt-in; e2e for webcam runs only on manual trigger |
| Visual regression false positives (font hinting, GPU variance) | High | Low | Tolerance threshold (1% pixel diff) + manual review workflow |
| GitHub rate limits under viral traffic | Low | High | ISR cache absorbs; add stale-while-revalidate fallback in `cache.ts` |

## Suggested Clarifications Before Implementation Begins

These are the answers needed before Phase 1 tasks are broken down:

1. Confirm **ISR revalidation interval** (assumed 1h).
2. Confirm **GitHub PAT scopes** (public only vs. including private).
3. Confirm **commit events inclusion** in event feed (yes/no; affects
   data-layer design in Phase 3).
4. Confirm **accent color** — a specific hex or "designer-picks-later."
5. Confirm **visitor timezone vs. developer timezone** for
   contribution grid labeling.
6. Confirm **fallback route approach** — meta-refresh from `/` to
   `/fallback`, or rendering fallback content inside `<noscript>` on
   `/`.
7. Confirm whether **`axe-playwright`** accessibility checks should
   land in Phase 1 (recommended) or Phase 5.

Once the above are locked, the next skill (`deliverables-tracking`) can
produce the master checklist without ambiguity.

## Items the Author Should Verify Before First Phase

- [ ] GitHub PAT scope decision
- [ ] Accent color decision (or explicit deferral)
- [ ] Timezone decision for contribution grid
- [ ] Commit-event inclusion decision
- [ ] Fallback route approach decision
- [ ] CSP header policy (flagged for Phase 1 addition)
- [ ] `axe-playwright` phase placement
- [ ] Node version (20 vs 22 LTS)
- [ ] Vercel region selection
