import { describe, expect, it } from 'vitest';
import { ambientAmplitudeFor } from '@/scene/ambient/damping';

describe('ambientAmplitudeFor', () => {
  it('passes base through when reducedMotion is false', () => {
    expect(ambientAmplitudeFor(false, 1)).toBe(1);
    expect(ambientAmplitudeFor(false, 0.5)).toBe(0.5);
    expect(ambientAmplitudeFor(false, 10)).toBe(10);
  });

  it('dampens to 10% when reducedMotion is true', () => {
    expect(ambientAmplitudeFor(true, 1)).toBeCloseTo(0.1, 6);
    expect(ambientAmplitudeFor(true, 0.5)).toBeCloseTo(0.05, 6);
  });

  it('keeps zero at zero', () => {
    expect(ambientAmplitudeFor(false, 0)).toBe(0);
    expect(ambientAmplitudeFor(true, 0)).toBe(0);
  });

  it('passes negative base through unchanged (defensive)', () => {
    expect(ambientAmplitudeFor(false, -0.5)).toBe(-0.5);
    expect(ambientAmplitudeFor(true, -0.5)).toBe(-0.5);
  });
});
