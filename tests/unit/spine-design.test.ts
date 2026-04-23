import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  spineMaterialParams,
  spineDimensions,
} from '@/scene/project-books/spine-design';

const accent = new THREE.Color('#c77a3b');

describe('spineMaterialParams', () => {
  it('cloth is matte (high roughness, no metalness)', () => {
    const p = spineMaterialParams(
      { color: '#3b2a1f', material: 'cloth', accent: false },
      accent,
    );
    expect(p.roughness).toBeCloseTo(0.85);
    expect(p.metalness).toBe(0);
  });

  it('leather has slight sheen + metalness', () => {
    const p = spineMaterialParams(
      { color: '#3b2a1f', material: 'leather', accent: false },
      accent,
    );
    expect(p.roughness).toBeCloseTo(0.55);
    expect(p.metalness).toBeCloseTo(0.05);
  });

  it('paper is roughest', () => {
    const p = spineMaterialParams(
      { color: '#3b2a1f', material: 'paper', accent: false },
      accent,
    );
    expect(p.roughness).toBeCloseTo(0.95);
    expect(p.metalness).toBe(0);
  });

  it('wax is polished (low roughness, slight metal)', () => {
    const p = spineMaterialParams(
      { color: '#3b2a1f', material: 'wax', accent: false },
      accent,
    );
    expect(p.roughness).toBeCloseTo(0.3);
    expect(p.metalness).toBeCloseTo(0.05);
  });

  it('accent = true produces non-zero emissive intensity', () => {
    const p = spineMaterialParams(
      { color: '#3b2a1f', material: 'cloth', accent: true },
      accent,
    );
    expect(p.emissiveIntensity).toBeGreaterThan(0);
    expect(p.emissive.equals(accent)).toBe(true);
  });

  it('accent = false produces zero emissive intensity', () => {
    const p = spineMaterialParams(
      { color: '#3b2a1f', material: 'cloth', accent: false },
      accent,
    );
    expect(p.emissiveIntensity).toBe(0);
  });
});

describe('spineDimensions', () => {
  it('returns stable dimensions regardless of material', () => {
    const a = spineDimensions({ color: '#000', material: 'cloth', accent: false });
    const b = spineDimensions({ color: '#000', material: 'leather', accent: true });
    expect(a).toEqual(b);
  });

  // P10-10: physical book dimensions match artist brief §5.3 — 0.022m thick,
  // 0.20m wide, 0.16m deep. Semantics: `width` is the short (thin spine) axis
  // that becomes the stacking-pitch when books lie flat; `height` is the book's
  // long edge (the dimension that reads as "cover width" when stacked);
  // `depth` is the front-to-back axis that faces the camera (carries the
  // spine stripe).
  it('matches the brief §5.3 physical dimensions', () => {
    const d = spineDimensions({ color: '#000', material: 'cloth', accent: false });
    expect(d.width).toBeCloseTo(0.022);
    expect(d.height).toBeCloseTo(0.2);
    expect(d.depth).toBeCloseTo(0.16);
  });
});
