import { describe, expect, it } from 'vitest';
import {
  tiltToOffset,
  seedBaseline,
  X_LIMIT,
  Y_LIMIT,
  type TiltEvent,
  type TiltBaseline,
} from '@/interaction/device-orientation';

const baseline: TiltBaseline = { beta: 10, gamma: 5 };

describe('tiltToOffset', () => {
  it('null beta yields zero offset', () => {
    const event: TiltEvent = { alpha: 0, beta: null, gamma: 0 };
    expect(tiltToOffset(event, baseline)).toEqual({ x: 0, y: 0, z: 0 });
  });

  it('null gamma yields zero offset', () => {
    const event: TiltEvent = { alpha: 0, beta: 0, gamma: null };
    expect(tiltToOffset(event, baseline)).toEqual({ x: 0, y: 0, z: 0 });
  });

  it('returns zero before baseline is seeded (null baseline)', () => {
    const event: TiltEvent = { alpha: 0, beta: 10, gamma: 5 };
    expect(tiltToOffset(event, null)).toEqual({ x: 0, y: 0, z: 0 });
  });

  it('event matching baseline yields zero offset', () => {
    const event: TiltEvent = { alpha: 0, beta: baseline.beta, gamma: baseline.gamma };
    expect(tiltToOffset(event, baseline)).toEqual({ x: 0, y: 0, z: 0 });
  });

  it('large gamma clamps to ±X_LIMIT', () => {
    const pos: TiltEvent = { alpha: 0, beta: baseline.beta, gamma: 500 };
    const neg: TiltEvent = { alpha: 0, beta: baseline.beta, gamma: -500 };
    expect(tiltToOffset(pos, baseline).x).toBeCloseTo(X_LIMIT, 5);
    expect(tiltToOffset(neg, baseline).x).toBeCloseTo(-X_LIMIT, 5);
  });

  it('large beta clamps to ±Y_LIMIT', () => {
    const pos: TiltEvent = { alpha: 0, beta: 500, gamma: baseline.gamma };
    const neg: TiltEvent = { alpha: 0, beta: -500, gamma: baseline.gamma };
    expect(tiltToOffset(pos, baseline).y).toBeCloseTo(Y_LIMIT, 5);
    expect(tiltToOffset(neg, baseline).y).toBeCloseTo(-Y_LIMIT, 5);
  });

  it('z is always zero (orientation has no depth axis)', () => {
    const event: TiltEvent = { alpha: 0, beta: 45, gamma: 30 };
    expect(tiltToOffset(event, baseline).z).toBe(0);
  });
});

describe('seedBaseline', () => {
  it('returns null when beta is null', () => {
    expect(seedBaseline({ alpha: 0, beta: null, gamma: 0 })).toBeNull();
  });

  it('returns null when gamma is null', () => {
    expect(seedBaseline({ alpha: 0, beta: 0, gamma: null })).toBeNull();
  });

  it('captures beta + gamma when both present', () => {
    expect(seedBaseline({ alpha: 17, beta: 12, gamma: -3 })).toEqual({
      beta: 12,
      gamma: -3,
    });
  });
});
