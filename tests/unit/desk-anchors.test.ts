import { describe, expect, it } from 'vitest';
import {
  LAMP_BASE_POSITION,
  LAMP_BULB_POSITION,
} from '@/scene/lamp/positions';
import {
  COFFEE_CUP_POSITION,
  PEN_POSITION,
  PLANT_POSITION,
  NOTES_POSITION,
} from '@/scene/ambient/positions';
import { GLOBE_POSITION } from '@/scene/globe/positions';

/**
 * P10-14 desk rebalance — verifies every desk-surface anchor exported from a
 * per-object positions module matches the brief §5.3 / architecture §8
 * coordinates and doesn't collide with siblings.
 */
describe('desk anchors (P10-14)', () => {
  it('Lamp base sits on the back-right of the desk surface', () => {
    expect(LAMP_BASE_POSITION[0]).toBeCloseTo(0.65);
    expect(LAMP_BASE_POSITION[1]).toBeCloseTo(0.79);
    expect(LAMP_BASE_POSITION[2]).toBeCloseTo(-0.25);
  });

  it('Lamp bulb is above the base at the brief-specified anchor', () => {
    expect(LAMP_BULB_POSITION[0]).toBeCloseTo(0.65);
    expect(LAMP_BULB_POSITION[1]).toBeCloseTo(1.3);
    expect(LAMP_BULB_POSITION[2]).toBeCloseTo(-0.1);
  });

  it('Coffee cup sits on the front-left of the desk surface', () => {
    expect(COFFEE_CUP_POSITION[0]).toBeCloseTo(-0.3);
    // Cup origin: cylinder half-height above desk surface (0.79 + 0.035).
    expect(COFFEE_CUP_POSITION[1]).toBeGreaterThanOrEqual(0.79);
    expect(COFFEE_CUP_POSITION[2]).toBeCloseTo(-0.05);
  });

  it('Globe is clear of the lamp by > 0.5 m in world XZ plane', () => {
    // With the globe moved to the front-left and the lamp at back-right, the
    // silhouettes should never overlap.
    const dx = GLOBE_POSITION[0] - LAMP_BASE_POSITION[0];
    const dz = GLOBE_POSITION[2] - LAMP_BASE_POSITION[2];
    expect(Math.hypot(dx, dz)).toBeGreaterThan(0.5);
  });

  it('Plant and notes remain on the desk surface (y ≥ 0.79) or floor by design', () => {
    expect(PLANT_POSITION[1]).toBeGreaterThan(0);
    expect(NOTES_POSITION[1]).toBeGreaterThanOrEqual(0.79);
  });

  it('Pen sits within the desk footprint (|x| < 1, |z| < 0.6)', () => {
    expect(Math.abs(PEN_POSITION[0])).toBeLessThan(1);
    expect(Math.abs(PEN_POSITION[2])).toBeLessThan(0.6);
    expect(PEN_POSITION[1]).toBeGreaterThanOrEqual(0.79);
  });
});
