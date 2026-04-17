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
    expect(a.width).toBe(0.018);
    expect(a.height).toBe(0.22);
    expect(a.depth).toBe(0.16);
  });
});
