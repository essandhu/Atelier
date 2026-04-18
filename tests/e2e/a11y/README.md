# Accessibility e2e

`axe.spec.ts` runs axe-core against the scene, fallback page, and every open
panel. Introduced in Phase 9 (P9-05) to close the last gap in the acceptance
test from `architecture.md §8 Phase 9`: "axe-core reports zero serious /
critical violations on `/`, `/fallback`, and each open panel state."

## Matrix

| Scenario | URL / state | Rationale |
|---|---|---|
| Root — evening | `/?time=evening` | default landing state, exercises panel-free canvas DOM |
| Root — morning | `/?time=morning` | cool palette; catches contrast regressions vs default |
| Root — day | `/?time=day` | high-key palette |
| Root — night | `/?time=night` | warm-lamp palette; highest bloom scenario |
| Fallback | `/fallback` | no-JS semantic HTML path; bypasses canvas entirely |
| Project panel open | `/?time=evening` + book-0 Enter | exercises radix Dialog portal DOM |
| Skills-catalog panel open | `/?time=evening` + skills-catalog-hotspot Enter | same |
| Globe panel open | `/?time=evening` + globe-hotspot Enter | same |

## Gate

**Blocking:** any violation with `impact: serious | critical`.
**Non-blocking:** `impact: minor | moderate` findings are logged to stdout
so they stay visible in CI output without failing the check. Disposition
(fix now / defer with reason) lives in `docs/a11y-audit.md`.

## Local reproduction

```bash
pnpm e2e tests/e2e/a11y/axe.spec.ts
# Scope to one scenario while iterating:
pnpm e2e tests/e2e/a11y/axe.spec.ts -g "project panel"
```

## Interpreting a failing report

When a test fails, the console output contains the full `blocking` payload
from `AxeBuilder.analyze()`:

```json
[
  {
    "id": "color-contrast",
    "impact": "serious",
    "nodes": [
      {
        "html": "<p style=\"color: rgb(...)\">...</p>",
        "target": ["[data-testid='project-panel-atelier'] p:nth-child(3)"]
      }
    ]
  }
]
```

The `target` CSS selector is enough to find the offending element; the
`id` maps to the axe rule reference on [dequeuniversity.com/rules/axe](https://dequeuniversity.com/rules/axe/).

## Why not part of the standard `e2e` job?

`a11y-axe` runs in parallel with `e2e` in `.github/workflows/ci.yml` so an
axe regression surfaces independently of functional-test noise. The two
suites share the same dev-server fixture pattern and Playwright install
step, so the wall-clock cost of splitting them is minimal.

## What axe does NOT catch

- **Screen-reader narration quality.** Covered manually in
  `docs/a11y-audit.md` §§ 2–5 (NVDA + VoiceOver transcripts).
- **Keyboard focus indicator visibility.** Covered by
  `tests/e2e/keyboard-nav.spec.ts` (P9-08) focus-visible-outline assertion.
- **Focus restoration on panel close.** Same spec (P9-08).
- **Reduced-motion contract.** Covered by `tests/e2e/reduced-motion.spec.ts`.

The axe gate is a **baseline**, not a substitute for the full a11y audit.
