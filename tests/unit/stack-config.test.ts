import { describe, expect, it } from 'vitest';
import {
  BOOK_GAP,
  BOOK_THICKNESS,
  MAX_BOOKS,
  STACK_CENTER_X,
  STACK_Z,
  STACK_BOTTOM_Y,
  bookYForIndex,
} from '@/scene/project-books/stack-config';

/**
 * P10-10 vertical restack — the stack lives at the front-right of the desk
 * with books laid flat, pitching up the Y-axis. Centre + pitch constants are
 * the single source of truth for both the scene component and the e2e anchor
 * expectations.
 */
describe('stack-config (P10-10 vertical stack)', () => {
  it('centres the stack at (0.50, ~, 0.15) — front-right empty desk space', () => {
    expect(STACK_CENTER_X).toBeCloseTo(0.5);
    expect(STACK_Z).toBeCloseTo(0.15);
  });

  it('exposes BOOK_THICKNESS = 0.022 m (brief §5.3)', () => {
    expect(BOOK_THICKNESS).toBeCloseTo(0.022);
  });

  it('seeds the stack from the desk surface (stackBottomY = 0.79)', () => {
    expect(STACK_BOTTOM_Y).toBeCloseTo(0.79);
  });

  it('bookYForIndex(i) puts each book at its half-thickness centre above the seed', () => {
    // Book 0: resting on the desk surface.
    expect(bookYForIndex(0)).toBeCloseTo(STACK_BOTTOM_Y + BOOK_THICKNESS / 2);
    // Book 1: sits on top of book 0.
    expect(bookYForIndex(1)).toBeCloseTo(
      STACK_BOTTOM_Y + BOOK_THICKNESS + BOOK_THICKNESS / 2,
    );
    // Book i: general formula.
    expect(bookYForIndex(5)).toBeCloseTo(
      STACK_BOTTOM_Y + 5 * BOOK_THICKNESS + BOOK_THICKNESS / 2,
    );
  });

  it('keeps MAX_BOOKS = 8 (tab-order derived, unchanged in P10-10)', () => {
    expect(MAX_BOOKS).toBe(8);
  });

  it('keeps BOOK_GAP defined but non-load-bearing for vertical pitch (books rest flush)', () => {
    // Vertical stack has no inter-book gap — books rest directly on each
    // other — but BOOK_GAP is retained for any future horizontal-variant
    // composition. The value itself is decoupled from bookYForIndex.
    expect(BOOK_GAP).toBeGreaterThanOrEqual(0);
  });
});
