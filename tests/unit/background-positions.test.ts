import { describe, expect, it } from 'vitest';
import {
  BACKGROUND_Z_CEILING,
  BOOKSHELF_POSITION,
  BOOKSHELF_SIZE,
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
