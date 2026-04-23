# Scene Assets

This directory holds the geometry, textures, and lightmaps that the
`<Scene>` composition root loads at runtime. Source authoring lives
**outside the repo**; only the compressed outputs ship here.

## Authoring tools

- **Geometry:** Blender 4.x. Single mesh per object (desk, lamp, window
  frame). Bake a second UV channel named `uv2` for the lightmap.
- **Lightmaps:** Blender Cycles bake → 32-bit EXR. One bake per
  time-of-day state.
- **Textures:** any 2D source (Substance, Photoshop, baked PBR) at
  1024² (albedo/roughness/AO) or 2048² (lightmaps).

## Source-of-truth location

Authoring `.blend`, `.exr`, and uncompressed PNG/TIFF files live on the
developer's local drive (and a private S3 bucket as offsite backup).
They are **not** version-controlled here.

## Compression pipeline

```bash
# Compress everything from staging dir into public/scene/.
pnpm assets:build

# Verify the committed scene fits the 15MB budget (one lightmap counted).
pnpm assets:verify
```

`scripts/asset-pipeline/compress-textures.mjs` classifies by filename:

| Filename pattern | Encoder | Notes |
|---|---|---|
| `*-normal.*`, `*normal*.*` | UASTC | preserves vector accuracy |
| everything else (`*-albedo*`, `*-roughness*`, `*-ao*`, lightmaps) | ETC1S | smallest size |

`scripts/asset-pipeline/compress-geometry.mjs` Draco-compresses GLBs.

## Budget

Hard gate: total of `public/scene/**` plus a 2MB reserve for one
lightmap **must not exceed 15MB** (`verify-budgets.mjs`). CI fails the
PR otherwise.

## Phase 2 scope

Phase 2 ships these files (developer-authored locally, then committed):

- `models/desk.glb`
- `textures/desk-albedo.ktx2`, `desk-normal.ktx2`, `desk-roughness.ktx2`
- `textures/lamp-albedo.ktx2`, `lamp-roughness.ktx2`
- `textures/window-frame-albedo.ktx2`, `window-frame-normal.ktx2`
- `lightmaps/evening.ktx2`

Until those land, the scene falls back to the procedural primitives
defined in `Desk.tsx`, `Window.tsx`, and `Lamp.tsx` so `pnpm dev` keeps
rendering.

## Phase 5 lightmaps

Phase 5 tunes the per-state presets and adds three more lightmap slots:

- `lightmaps/morning.ktx2` — cool sidelight, bloom focus on the window.
- `lightmaps/day.ktx2` — neutral-cool high-key, bloom minimal.
- `lightmaps/night.ktx2` — near-black window, lamp-hero bloom.

The tuning lives in `src/time-of-day/presets.ts`. Authoring the actual KTX2
files is a developer-local step — see
[`scripts/bake-lightmaps.md`](../../scripts/bake-lightmaps.md) for the Blender
workflow. The runtime path tolerates missing files by design, so CI is green
whether or not the bakes are committed.

## Phase 10 GitHub avatar

`avatar.jpg` is the square WallPiece texture (§5.11). It is **not**
committed — `scripts/fetch-github-avatar.mjs` regenerates it on every
`pnpm assets:build` from `https://github.com/{GITHUB_USERNAME}.png?size=460`.

- Path: `public/scene/avatar.jpg` (ignored by git).
- Refresh: `pnpm assets:fetch-avatar` (also invoked by `pnpm assets:build`).
- Dry-run: `pnpm assets:fetch-avatar --dry-run` logs the URL and target path
  without touching disk.
- Username resolution: `--username=<name>` argv → `GITHUB_USERNAME` env →
  `essandhu` (matches `src/content/profile.ts`).
- Fallback: when the local JPEG is missing, `<WallPiece>` uses
  `GithubSnapshot.avatarUrl` — the stable `github.com/{user}.png?size=460`
  redirect — so the scene still renders in a clean checkout.

## Phase 9 compression review

**Date:** 2026-04-18.

Phase 9 (P9-01) reviewed the encoder parameters without re-running against
shipped assets — `public/scene/textures/` remains empty through Phase 9 by
design, and Phase 10 owns the actual PBR authoring + commit story.

### Decision

Current params are correct for the Phase 10 PBR intake. **No change** to the
encoder call shape. Updated: params moved to named constants at the top of
`scripts/asset-pipeline/compress-textures.mjs` and logged in the per-file
`{ status: 'ok', ... }` payload so Phase 10 can diff byte-savings
deterministically.

| Classification | Filename pattern | Encoder | Params | Reasoning |
|---|---|---|---|---|
| Normals | `*normal*` | UASTC | `-uastc -uastc_level 2` | Level 2 preserves vector accuracy at the smallest perceptually-lossless size for the desk/lamp/window normal set. Level 4 is 2× encode time with marginal gain on mid-frequency surfaces; level 0 shows banding on low-frequency curves. |
| Albedo / roughness / AO / lightmaps | everything else | ETC1S | `-comp_level 2 -q 128` | `-q 128` hits the quality/size sweet spot for 1024² albedo/roughness. `-comp_level 2` balances encode time against final size. `-q 255` doubles file size for no visible gain on a portfolio scene; `-q 64` introduces block artefacts on low-contrast albedos. |

### Proof-of-pipeline

A 1×1 RGBA fixture PNG lives at
`scripts/asset-pipeline/fixtures/albedo-test.png` (70 bytes). The
`pnpm assets:build:fixture` script sets `TEXTURE_SOURCE_DIR` to that
directory and `TEXTURE_OUTPUT_DIR` to a `tmpdir()` path, then drives
`compress-textures.mjs` against it and asserts a non-empty `.ktx2` lands in
the temp output. The generated `.ktx2` is **not** committed.

On environments without `basisu` on `PATH` the fixture script exits
gracefully with `{"status":"skip","reason":"basisu binary not installed"}`
and exit code 0, mirroring the main script's no-ops-when-empty behaviour.
Install [KTX-Software](https://github.com/BinomialLLC/basis_universal) to
exercise the full round-trip locally.

### Byte-savings verification

Deferred to Phase 10. Measuring real compression ratios requires the
committed PBR textures that Phase 10 will author. When they land, the
per-file `uastcLevel` / `compLevel` / `q` fields in the
`{ status: 'ok', ... }` log payload give Phase 10 a deterministic anchor
for "params changed → expected savings delta" comparisons.

### Invariants preserved

- `pnpm assets:build` against an empty `assets-src/textures/` still emits
  `{"status":"noop", ...}` and exits 0. The review did not regress the
  no-ops-when-empty guarantee.
- No `public/scene/textures/*.ktx2` file is added by this phase.
- `pnpm assets:verify` (15 MB scene-asset budget) remains untouched.
