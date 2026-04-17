# Atelier

A cinematic, spatial developer portfolio. Live activity from GitHub, a hand-lit 3D scene, and a printed-page fallback for when JS is off.

## Local development

Prerequisites: **Node 20.x** (see `.nvmrc`) and **pnpm 9.x** via Corepack.

```bash
corepack enable
corepack use pnpm@9
cp .env.example .env.local   # fill in GITHUB_PAT and GITHUB_USERNAME
pnpm install
pnpm dev
```

Open http://localhost:3000/. The Phase 1 debug page renders your real 90-day GitHub contribution total from the server.

## Scripts

| Script | Purpose |
|---|---|
| `pnpm dev` | Next.js dev server on :3000 |
| `pnpm build` | Production build |
| `pnpm start` | Serve the production build |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm test` | Vitest unit tests |
| `pnpm e2e` | Playwright end-to-end suite |
| `pnpm assets:verify` | Enforce the scene-asset budget |
| `pnpm bundle:verify` | Enforce the gzipped JS budget (runs after `pnpm build`) |

## Project docs

- [`docs/BRIEF.md`](docs/BRIEF.md) — product brief
- [`docs/architecture.md`](docs/architecture.md) — architecture document (source of truth)
- [`docs/deliverables-checklist.md`](docs/deliverables-checklist.md) — project-wide deliverables
- [`docs/phase-1-tasks.md`](docs/phase-1-tasks.md) — current phase task list

## License

Code is MIT; see [`LICENSE`](LICENSE). Docs under `docs/` and assets under `public/` are all-rights-reserved.
