# MediaPipe Face Landmarker assets

This directory holds the WebAssembly runtime and model weights used by the
opt-in webcam parallax (`src/interaction/webcam/FaceTracker.tsx`).

## Privacy / hosting posture (ADR-009)

Per ADR-009, model weights must be served from the app's own origin or a
trusted CDN — **never** from GCP's default hosted URLs. All frame data
stays on-device; only the opt-in gate records a single `webcam.opted_in`
/ `webcam.declined` telemetry event.

## Files expected here (Phase 10 asset commit)

- `wasm/vision_wasm_internal.js`
- `wasm/vision_wasm_internal.wasm`
- `wasm/vision_wasm_nosimd_internal.js`
- `wasm/vision_wasm_nosimd_internal.wasm`
- `face_landmarker.task` — the Face Landmarker model weights

The source for these files is the pinned `@mediapipe/tasks-vision` package
version in `package.json` (pair the runtime version with the matching
model weights — versions must match).

## Phase 8 interim

Phase 8 leaves these binaries uncommitted, following the same
"developer-local authoring deferral" pattern used by `desk.glb` and
`textures/*.ktx2` (the Blender-authored assets under `public/scene/`).
For developer convenience during Phase 8:

- `FaceTracker.tsx` falls back to the matching CDN version at
  `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@<version>/wasm`
  when the same-origin files are absent.
- This fallback is a **development convenience only** — Phase 10 is
  responsible for committing the binaries under this directory and
  disabling the CDN fallback before production.

## Sizing

The WASM + model weights total ~5–10 MB. These MUST NOT land in the
initial JavaScript bundle; `FaceTracker.tsx` uses a dynamic `import()`
that is exercised only on opt-in. See
`scripts/asset-pipeline/verify-bundle-size.mjs` for the enforced
"no `mediapipe` in initial chunk" assertion.
