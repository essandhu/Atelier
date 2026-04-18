import { describe, expect, it } from 'vitest';
import {
  IDLE_SPIN_RATE,
  PIXELS_PER_RADIAN,
  impartMomentumFromDrag,
  stepMomentum,
} from '@/scene/globe/momentum';

describe('stepMomentum', () => {
  it('returns the input velocity when decay*delta is zero', () => {
    expect(stepMomentum(0.5, 0, 2)).toBeCloseTo(0.5, 10);
    expect(stepMomentum(0.5, 1, 0)).toBeCloseTo(0.5, 10);
  });

  it('decays exponentially: v(1) = v0 * e^(-decay)', () => {
    const result = stepMomentum(1, 1, 2);
    expect(result).toBeCloseTo(Math.exp(-2), 6);
  });

  it('preserves sign (negative velocities decay too)', () => {
    const result = stepMomentum(-0.4, 0.5, 1);
    expect(result).toBeLessThan(0);
    expect(result).toBeCloseTo(-0.4 * Math.exp(-0.5), 6);
  });
});

describe('impartMomentumFromDrag', () => {
  it('yields zero velocity for zero drag', () => {
    expect(impartMomentumFromDrag(0, 250)).toBe(0);
  });

  it('yields positive velocity for positive drag', () => {
    const v = impartMomentumFromDrag(120, 250);
    expect(v).toBeGreaterThan(0);
  });

  it('is symmetric: a negative drag of equal magnitude gives inverse velocity', () => {
    const a = impartMomentumFromDrag(120, 250);
    const b = impartMomentumFromDrag(-120, 250);
    expect(b).toBeCloseTo(-a, 10);
  });

  it('uses PIXELS_PER_RADIAN as the conversion constant', () => {
    // 120 px over 250 ms → (120 / 200) rad over 0.25 s = 2.4 rad/s.
    const v = impartMomentumFromDrag(120, 250);
    const expected = 120 / PIXELS_PER_RADIAN / (250 / 1000);
    expect(v).toBeCloseTo(expected, 10);
  });

  it('returns zero when duration is zero (avoids divide-by-zero)', () => {
    expect(impartMomentumFromDrag(40, 0)).toBe(0);
  });
});

describe('IDLE_SPIN_RATE', () => {
  it('is a small positive rad/s constant', () => {
    expect(typeof IDLE_SPIN_RATE).toBe('number');
    expect(IDLE_SPIN_RATE).toBeGreaterThan(0);
    expect(IDLE_SPIN_RATE).toBeLessThan(0.5);
  });
});
