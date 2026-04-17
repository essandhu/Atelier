import * as THREE from 'three';
import { getAccent } from '@/ui/controls/accent';

// The only place the 0..4 level scale maps to physical scene-world units.
// Level 0 keeps a thin base so the grid reads as a surface rather than voids.
const HEIGHTS: readonly [number, number, number, number, number] = [
  0.0005, 0.002, 0.004, 0.006, 0.008,
];

const NEUTRAL = new THREE.Color('#1a120c');
const WARM_SHIFT = new THREE.Color('#ff9a3c');
const COOL_SHIFT = new THREE.Color('#4f6dff');

export const cellHeight = (level: 0 | 1 | 2 | 3 | 4): number =>
  HEIGHTS[level];

// Blend accent toward neutral by level, then tint by warmth.
// level 0 → ~neutral, level 4 → ~accent.
// warmth < 0 → cool shift, warmth > 0 → warm shift.
export const cellEmission = (
  level: 0 | 1 | 2 | 3 | 4,
  warmth: number,
): THREE.Color => {
  const accent = getAccent();
  const t = level / 4;
  const base = NEUTRAL.clone().lerp(accent, t);
  if (warmth > 0) {
    return base.lerp(WARM_SHIFT, Math.min(warmth, 1) * 0.35);
  }
  if (warmth < 0) {
    return base.lerp(COOL_SHIFT, Math.min(-warmth, 1) * 0.35);
  }
  return base;
};

export const cellMaterialFactory = (): THREE.MeshStandardMaterial =>
  new THREE.MeshStandardMaterial({
    roughness: 0.35,
    metalness: 0.0,
    emissiveIntensity: 1.0,
  });

export const LEVEL_EMISSION_INTENSITY: readonly [
  number,
  number,
  number,
  number,
  number,
] = [0.0, 0.15, 0.3, 0.45, 0.6];
