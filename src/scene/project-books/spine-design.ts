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

const DIMENSIONS: SpineDimensions = {
  width: 0.018,
  height: 0.22,
  depth: 0.16,
};

// Books are visually similar across projects; the spine drives color/material,
// not size. The spine argument is kept in the signature so future phases can
// vary dimensions per material without a breaking change.
export const spineDimensions = (spine: Spine): SpineDimensions => {
  void spine;
  return DIMENSIONS;
};
