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
