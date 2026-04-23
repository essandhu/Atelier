import { describe, expect, it } from 'vitest';
import {
  BACKGROUND_Z_CEILING,
  BOOKSHELF_POSITION,
  BOOKSHELF_SIZE,
  PINBOARD_POSITION,
  PINBOARD_SIZE,
  WALL_PIECE_POSITION,
  WALL_PIECE_SIZE,
} from '@/scene/background/positions';

describe('background positions (Phase 7)', () => {
  it('keeps the bookshelf behind the background Z ceiling', () => {
    expect(BOOKSHELF_POSITION[2]).toBeLessThan(BACKGROUND_Z_CEILING);
  });

  it('keeps the wall piece behind the background Z ceiling', () => {
    expect(WALL_PIECE_POSITION[2]).toBeLessThan(BACKGROUND_Z_CEILING);
  });

  it('places both anchors above the floor with positive Y', () => {
    expect(BOOKSHELF_POSITION[1]).toBeGreaterThan(0);
    expect(Number.isFinite(BOOKSHELF_POSITION[1])).toBe(true);
    expect(WALL_PIECE_POSITION[1]).toBeGreaterThan(0);
    expect(Number.isFinite(WALL_PIECE_POSITION[1])).toBe(true);
  });

  it('uses strictly positive size on every axis', () => {
    for (const axis of BOOKSHELF_SIZE) {
      expect(axis).toBeGreaterThan(0);
    }
    for (const axis of WALL_PIECE_SIZE) {
      expect(axis).toBeGreaterThan(0);
    }
  });
});

describe('Phase 10 wall piece — square avatar frame', () => {
  it('anchors the wall piece at the Phase 10 brief §5.6 position', () => {
    expect(WALL_PIECE_POSITION).toEqual([0, 1.75, -2.35]);
  });

  it('uses a square 0.4 × 0.4 m size', () => {
    expect(WALL_PIECE_SIZE).toEqual([0.4, 0.4]);
    expect(WALL_PIECE_SIZE[0]).toBe(WALL_PIECE_SIZE[1]);
  });
});

describe('Phase 10 pinboard anchor', () => {
  it('sits below the wall piece on the back wall', () => {
    expect(PINBOARD_POSITION).toEqual([0, 1.25, -2.3]);
    expect(PINBOARD_POSITION[1]).toBeLessThan(WALL_PIECE_POSITION[1]);
  });

  it('is behind the background Z ceiling and in front of the wall', () => {
    expect(PINBOARD_POSITION[2]).toBeLessThan(BACKGROUND_Z_CEILING);
    // Pinboard sits 5 cm in front of the wall piece (which hugs the wall).
    expect(PINBOARD_POSITION[2]).toBeGreaterThan(WALL_PIECE_POSITION[2]);
  });

  it('has an 0.8 × 0.5 × 0.02 m corkboard volume', () => {
    expect(PINBOARD_SIZE).toEqual([0.8, 0.5, 0.02]);
    for (const axis of PINBOARD_SIZE) {
      expect(axis).toBeGreaterThan(0);
    }
  });
});
