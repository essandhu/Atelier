# Atelier

A spatial, cinematic developer portfolio rendered in real-time WebGL — a reading room where projects sit on a desk as books, live GitHub activity breathes in from the window, and a printed-page fallback waits when JavaScript is off.

## Why it's interesting

Most portfolios reach for résumé-grid or demo-reel and let the content speak. Atelier goes the other way: it treats the portfolio as an environment. An evening-lit interior, a single lamp, a window, two kinds of books. Open a book and a shadcn-styled panel rises over the pages; Escape, click-outside, and focus restoration all close it. Keyboard-only traversal is a first-class path. No-JS visitors are meta-refreshed straight to `/fallback`, where every project, skill, and résumé entry renders as semantic HTML with the same typographic system as the 3D scene.

Every phase is gated by measurable acceptance tests — route bundle stays under 1 MB, p5 frame rate per time-of-day state, Lighthouse score on the night (pessimistic) state, per-state visual-regression screenshots. The performance budget is enforced by the repo, not by hope. The architecture doc in [`docs/architecture.md`](docs/architecture.md) is the source of truth; the phase task files under `docs/phase-N-tasks.md` are the operational contracts.

## Live URL

- Production: _coming with V1 launch_
- Preview: Vercel preview URL on every PR (commented by the Vercel bot)
- Social share: [`/opengraph-image`](/opengraph-image) — a static Satori-rendered evening poster.

## Notable stack choices

- **Next.js 15 + React 19** for server-routed content and streaming SSR.
- **React Three Fiber + Three.js** for the scene (`src/scene/**`), composed around a single `<Canvas>` root in `src/scene/Scene.tsx`.
- **Zustand vanilla stores** for state that the scene reads without re-rendering React components — one store per concern (`time-of-day`, `scene` panel phase, `prefs`).
- **Radix Dialog primitives** (direct composition, not the shadcn wrapper) for the project panel — gives the focus trap and Escape handling for free.
- **Framer Motion** for the intro overlay and panel entry/exit.
- **Tailwind CSS v4 + tokens.css** for the UI layer — tokens handle the accent, ink, and surface colours; Tailwind handles layout.
- **Zod** for content schemas — every `src/content/**` entry is parsed at load time so typos blow up at boot, not in production.
- **Vitest + Playwright** — unit + component + end-to-end + visual regression + Lighthouse CI, wired into GitHub Actions.

## Architecture

Source-of-truth architecture document: [`docs/architecture.md`](docs/architecture.md). The interesting sections:

- §4 — data model (Profile, Project, Skill, ExperienceEntry, GithubSnapshot).
- §5 — runtime surfaces (Scene composition, UI layer, interaction layer, time-of-day system).
- §7 — performance budget and observability.
- §8 — phase-by-phase acceptance gates.
- §11.5 — reduced-motion divergence.

## Local development

Prerequisites: **Node 20.x** (see `.nvmrc`) and **pnpm 9.x** via Corepack.

```bash
corepack enable
corepack use pnpm@9
cp .env.example .env.local   # fill in GITHUB_PAT and GITHUB_USERNAME
pnpm install
pnpm dev
```

Open http://localhost:3000/. The live GitHub activity pulls your real 90-day contribution total from the server; switch to fixture mode with `NEXT_PUBLIC_GITHUB_MODE=fixture` for a deterministic snapshot.

Force a specific time-of-day state for QA: `http://localhost:3000/?time=morning` (or `day`, `evening`, `night`).

### Scripts

| Script | Purpose |
|---|---|
| `pnpm dev` | Next.js dev server on :3000 |
| `pnpm build` | Production build |
| `pnpm start` | Serve the production build |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm test` | Vitest unit + component suite |
| `pnpm e2e` | Playwright end-to-end suite (fixture mode) |
| `pnpm assets:verify` | Enforce the 15 MB scene-asset budget |
| `pnpm bundle:verify` | Enforce the 1 MB route-bundle budget (runs after `pnpm build`) |

## Performance

See [`docs/perf-gates.md`](docs/perf-gates.md) for the full story. Summary:

- **Bundle guard** — `pnpm bundle:verify` fails on any route exceeding 1 MB gzipped first-load JS.
- **Asset guard** — `pnpm assets:verify` caps `public/scene/**` + a 2 MB lightmap reserve at 15 MB.
- **Lighthouse CI** — PR-blocking run against the Vercel preview URL on `?time=night`; fails below 0.80 performance, or LCP > 2.5 s, or CLS > 0.1.
- **Playwright perf harness** — p5 frame-rate gate per time-of-day state (opt-in on preview deploys — CI runners lack GPU acceleration).
- **Visual regression** — per-state screenshot diffs in `.github/workflows/visual-regression.yml`.

## Contributing

External contributions aren't accepted — this is a personal production project. Bug reports and suggestions are welcome as GitHub issues.

## License

Code is MIT; see [`LICENSE`](LICENSE). Content under `src/content/**`, assets under `public/`, and the architecture doc under `docs/architecture.md` are all-rights-reserved. The MIT boundary covers the runtime, the build pipeline, the shader/material math, and anything else that isn't personal narrative or authored media.

## Project docs

- [`docs/BRIEF.md`](docs/BRIEF.md) — product brief
- [`docs/architecture.md`](docs/architecture.md) — architecture document (source of truth)
- [`docs/deliverables-checklist.md`](docs/deliverables-checklist.md) — project-wide deliverables
- [`docs/keyboard-nav.md`](docs/keyboard-nav.md) — fixed Tab order reference
- [`docs/perf-gates.md`](docs/perf-gates.md) — performance budgets + how to reproduce locally
- [`docs/phase-5-tasks.md`](docs/phase-5-tasks.md) — most recent phase task list
