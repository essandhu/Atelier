import * as THREE from 'three';
import type { Project } from '@/content/projects/schemas';

type Spine = Project['spine'];

export interface SpineMaterialParams {
  color: THREE.Color;
  roughness: number;
  metalness: number;
  emissive: THREE.Color;
  emissiveIntensity: number;
}

export interface SpineDimensions {
  width: number;
  height: number;
  depth: number;
}

const MATERIAL_PRESETS: Record<
  Spine['material'],
  { roughness: number; metalness: number }
> = {
  cloth: { roughness: 0.85, metalness: 0 },
  leather: { roughness: 0.55, metalness: 0.05 },
  paper: { roughness: 0.95, metalness: 0 },
  wax: { roughness: 0.3, metalness: 0.05 },
};

export const spineMaterialParams = (
  spine: Spine,
  accentColor: THREE.Color,
): SpineMaterialParams => {
  const preset = MATERIAL_PRESETS[spine.material];
  return {
    color: new THREE.Color(spine.color),
    roughness: preset.roughness,
    metalness: preset.metalness,
    emissive: accentColor.clone(),
    emissiveIntensity: spine.accent ? 0.15 : 0,
  };
};

// Artist brief §5.3.1 — 0.20 × 0.022 × 0.16 m. Semantics
// updated to the contract's "flat-at-rest" orientation:
//
//   width (X)  — spine-length axis; the long edge of the closed book
//   height (Y) — thickness; the stack pitch when books stack vertically
//   depth (Z)  — the short edge of the closed book's top face (page width)
//
// These match the axes the runtime expects from the artist's GLB, so
// the Stage-A primitive and the Stage-B delivered mesh share one frame.
// Previously `width` was the thin axis and `height` was the long edge;
// that swap was the P10 composition bug fixed in P10-18/19.
const DIMENSIONS: SpineDimensions = {
  width: 0.2,
  height: 0.022,
  depth: 0.16,
};

// Books are visually similar across projects; the spine drives color/material,
// not size. The spine argument is kept in the signature so future phases can
// vary dimensions per material without a breaking change.
export const spineDimensions = (spine: Spine): SpineDimensions => {
  void spine;
  return DIMENSIONS;
};
