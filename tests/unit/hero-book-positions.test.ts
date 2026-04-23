import { describe, expect, it } from 'vitest';
import {
  HERO_BOOK_POSITION,
  HERO_BOOK_ROTATION,
  HERO_BOOK_SIZE,
  HERO_PAGE_FAN_RAD,
} from '@/scene/hero-book/positions';

/**
 * P10-09 — brief §5.3: open tilted hardcover at (−0.05, 0.79, 0.05),
 * spine along local Y, pages fan ~10° from the desk plane.
 */
describe('hero-book anchors (P10-09)', () => {
  it('position matches the brief §5.3 desk-centre anchor', () => {
    expect(HERO_BOOK_POSITION[0]).toBeCloseTo(-0.05);
    expect(HERO_BOOK_POSITION[1]).toBeCloseTo(0.79);
    expect(HERO_BOOK_POSITION[2]).toBeCloseTo(0.05);
  });

  it('exports a finite rotation 3-tuple', () => {
    expect(HERO_BOOK_ROTATION).toHaveLength(3);
    for (const r of HERO_BOOK_ROTATION) {
      expect(Number.isFinite(r)).toBe(true);
    }
  });

  it('page fan is ~10 degrees off the desk plane', () => {
    // 10° expressed in radians — pages tilt up off the desk, not flat.
    expect(HERO_PAGE_FAN_RAD).toBeGreaterThan(0);
    expect(HERO_PAGE_FAN_RAD).toBeLessThanOrEqual((15 * Math.PI) / 180);
  });

  it('book size stays within the brief §5.3 desk footprint', () => {
    // Open hero book is wider than a stacked book (two pages) but still
    // fits inside a desk footprint that is ≤ 1 m on the x-axis.
    expect(HERO_BOOK_SIZE[0]).toBeGreaterThan(0);
    expect(HERO_BOOK_SIZE[0]).toBeLessThan(0.6);
    expect(HERO_BOOK_SIZE[2]).toBeGreaterThan(0);
    expect(HERO_BOOK_SIZE[2]).toBeLessThan(0.4);
  });
});
