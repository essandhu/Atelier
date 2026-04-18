import { describe, expect, it } from 'vitest';
import {
  GLOBE_POSITION,
  GLOBE_RADIUS,
  markerCartesian,
} from '@/scene/globe/positions';

describe('GLOBE_POSITION', () => {
  it('sits on the back-right of the desk surface (y ≈ 0.86)', () => {
    expect(GLOBE_POSITION).toHaveLength(3);
    expect(GLOBE_POSITION[0]).toBeGreaterThan(0);
    expect(GLOBE_POSITION[2]).toBeLessThan(0);
    expect(GLOBE_POSITION[1]).toBeGreaterThan(0.75);
  });
});

describe('markerCartesian', () => {
  it('places (lat=0, lon=0) on the +Z equator at radius', () => {
    const p = markerCartesian(0, 0, GLOBE_RADIUS);
    expect(p[0]).toBeCloseTo(0, 10);
    expect(p[1]).toBeCloseTo(0, 10);
    expect(p[2]).toBeCloseTo(GLOBE_RADIUS, 10);
  });

  it('north pole (lat=90) lies on +Y', () => {
    const p = markerCartesian(90, 0, 1);
    expect(p[0]).toBeCloseTo(0, 10);
    expect(p[1]).toBeCloseTo(1, 10);
    expect(p[2]).toBeCloseTo(0, 10);
  });

  it('is idempotent for radius scaling', () => {
    const a = markerCartesian(31, -100, 1);
    const b = markerCartesian(31, -100, 2);
    expect(b[0]).toBeCloseTo(a[0] * 2, 10);
    expect(b[1]).toBeCloseTo(a[1] * 2, 10);
    expect(b[2]).toBeCloseTo(a[2] * 2, 10);
  });

  it('puts the marker at radius magnitude', () => {
    const r = 0.08;
    const [x, y, z] = markerCartesian(31, -100, r);
    const mag = Math.sqrt(x * x + y * y + z * z);
    expect(mag).toBeCloseTo(r, 10);
  });
});
