# Baking the Time-of-Day Lightmaps

Phase 5 introduces three new baked lightmaps — `morning`, `day`, `night` —
alongside the Phase 2 `evening` bake. This document is the step-by-step
authoring reference; the runtime path at
[`src/scene/lighting/Lightmaps.tsx`](../src/scene/lighting/Lightmaps.tsx) will
`HEAD`-probe the URL, log a dev-only warning on 404, and render the scene
unlit if a bake is missing — so CI tolerates this authoring being deferred to
developer hardware.

## Prerequisites

- **Blender 4.x** with Cycles GPU rendering (RTX 20xx+ or Apple M-series).
- **toktx** (from [KTX-Software](https://github.com/KhronosGroup/KTX-Software))
  on `PATH`.
- The `.blend` authoring files live outside this repo (developer drive + S3
  offsite backup — see `public/scene/README.md`).

## One scene, four lighting rigs

Keep a single `.blend` with one desk + lamp + window geometry, and four
named **View Layers** for the time-of-day variants. Each layer overrides:

| Layer | Sun intensity | Sun color | Sun elevation | Lamp contribution | Notes |
| :-- | --: | :-- | --: | :-- | :-- |
| `morning` | 2.5 | `#c8d9f0` (cool) | 12° | 0.5× | Window is the primary; lamp just pre-heats. |
| `day` | 4.0 | `#eaf0f7` (neutral-cool) | 55° | 0.25× | Flat, high-key, bloom minimal. |
| `evening` | 1.2 | `#f7a062` (warm amber) | 6° | 1.0× | Reference bake — already shipped. |
| `night` | 0.05 | `#1a1e2a` (deep) | −10° | 1.4× | Lamp is hero. |

These settings produce the per-state presets declared in
[`src/time-of-day/presets.ts`](../src/time-of-day/presets.ts) — keep them in
sync if you retune.

## Bake settings (Cycles)

```text
Render Engine        : Cycles
Device               : GPU Compute
Feature Set          : Supported
Sampling (Render)    : 2048 samples, Adaptive on, Noise Threshold 0.005
Light Paths          : Max Bounces 12, Diffuse 4, Glossy 4, Transmission 4
Bake Type            : Combined  (diffuse + direct + indirect)
Selected to Active   : off
UV                   : uv2 (second UV channel authored on the desk/lamp/window meshes)
Margin               : 8 px, Extend
Clear Image          : on
Image Size           : 2048 × 2048  (fits the 2 MB per-lightmap budget after KTX2/ETC1S)
Color Space          : Linear Rec.709   (do NOT bake in sRGB — compress-textures.mjs assumes linear EXRs)
```

Bake each View Layer into its own `<state>.exr` under your authoring staging
directory (for example `~/work/atelier-scene/staging/lightmaps/`).

## Compression

Drop the four EXRs into the staging directory structure expected by the
pipeline and run:

```bash
pnpm assets:build
# Compresses staging/lightmaps/*.exr → public/scene/lightmaps/*.ktx2 via ETC1S.
# Filename classifier in scripts/asset-pipeline/compress-textures.mjs routes
# *-lightmap or lightmaps/* to ETC1S at quality 128.
```

Spot-check each KTX2 file with `toktx --test` or by loading it in the running
dev scene — if the sampler looks muddy, re-bake with a higher quality target
(quality 160 costs ~40 % more bytes but is still within the 2 MB-per-file
budget at 2048²).

## Verify

```bash
pnpm assets:verify
```

The verifier sums `public/scene/**` and adds a **2 MB reserve** for one active
lightmap (we only ever ship one at runtime because the others stream in on
state change). The 15 MB hard gate stays intact with all four committed
because each is ≤ 1.8 MB post-ETC1S.

## Commit

```bash
git add public/scene/lightmaps/morning.ktx2 public/scene/lightmaps/day.ktx2 \
        public/scene/lightmaps/night.ktx2
git commit -m "feat(scene): morning/day/night lightmaps"
```

`evening.ktx2` already ships (Phase 2) — do not re-bake unless the evening
preset changes.

## CI-tolerant behaviour

If any of the four files is missing at serve time:
- `Lightmaps.tsx` HEAD-probes the URL, logs
  `[lightmaps] missing: <state> — rendering unlit` in dev,
  and mounts the scene without the lightmap.
- `pnpm assets:verify` still passes (the 2 MB reserve is a headroom
  allocation, not a presence check).
- The acceptance-test gate that matters is the **state switcher** behaviour,
  not the bake quality — `?time=morning` must still resolve + wire up the
  correct preset values.

## Redo the evening bake?

Only re-bake `evening` if `presets.evening` changes materially. The phase-2
evening tuning is authoritative — `docs/phase-2-review.md` pins the visual
baseline.
