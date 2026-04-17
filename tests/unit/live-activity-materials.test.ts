import { describe, expect, it, afterEach, vi } from 'vitest';
import * as THREE from 'three';
import {
  cellHeight,
  cellEmission,
  cellMaterialFactory,
} from '@/scene/live-activity/materials';

describe('cellHeight', () => {
  it('returns a positive, smallest height for level 0 so the grid reads as a surface', () => {
    const h0 = cellHeight(0);
    expect(h0).toBeGreaterThan(0);
    for (const level of [1, 2, 3, 4] as const) {
      expect(cellHeight(level)).toBeGreaterThan(h0);
    }
  });

  it('returns strictly monotonic heights across levels 0..4', () => {
    const hs = [0, 1, 2, 3, 4].map((l) =>
      cellHeight(l as 0 | 1 | 2 | 3 | 4),
    );
    for (let i = 1; i < hs.length; i++) {
      expect(hs[i]).toBeGreaterThan(hs[i - 1]);
    }
  });

  it('pegs level 4 at the documented 8mm scene-world height', () => {
    expect(cellHeight(4)).toBeCloseTo(0.008, 6);
  });
});

describe('cellEmission', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns a THREE.Color', () => {
    const c = cellEmission(2, 0.4);
    expect(c).toBeInstanceOf(THREE.Color);
  });

  it('blends toward the accent as level rises (level 0 darker than level 4)', () => {
    const dark = cellEmission(0, 0.4);
    const bright = cellEmission(4, 0.4);
    const lum = (c: THREE.Color): number => c.r + c.g + c.b;
    expect(lum(bright)).toBeGreaterThan(lum(dark));
  });

  it('positive warmth shifts the hue warmer than negative warmth at the same level', () => {
    const cold = cellEmission(3, -0.8);
    const warm = cellEmission(3, 0.8);
    // Warm should have greater red than green compared to cold.
    const warmBias = warm.r - warm.g;
    const coldBias = cold.r - cold.g;
    expect(warmBias).toBeGreaterThan(coldBias);
  });
});

describe('cellMaterialFactory', () => {
  it('returns a MeshStandardMaterial with the documented roughness/metalness/emissiveIntensity', () => {
    const m = cellMaterialFactory();
    expect(m).toBeInstanceOf(THREE.MeshStandardMaterial);
    expect(m.roughness).toBeCloseTo(0.35, 5);
    expect(m.metalness).toBeCloseTo(0.0, 5);
    expect(m.emissiveIntensity).toBeCloseTo(1.0, 5);
  });

  it('returns distinct material instances on repeat calls (no shared-reference bug)', () => {
    const a = cellMaterialFactory();
    const b = cellMaterialFactory();
    expect(a).not.toBe(b);
  });
});
