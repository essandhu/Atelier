import { TAB_ORDER } from '@/interaction/tab-order';

/**
 * Single source of truth for the on-desk project-book stack geometry + cap.
 *
 * P10-10 vertical restack: books now lie flat and stack up the Y-axis at a
 * front-right anchor on the desk. The legacy BOOK_GAP is retained for
 * potential future horizontal-variant compositions but is not consumed by
 * the current vertical layout — books rest directly on each other.
 *
 * MAX_BOOKS is derived from TAB_ORDER so the numeric tabIndex range and the
 * visible stack size stay in lockstep — bump `projectBookMax` to grow the
 * stack and every consumer (ProjectBookStack slice, e2e Tab assertions,
 * docs) scales with it.
 */
export const MAX_BOOKS =
  TAB_ORDER.projectBookMax - TAB_ORDER.projectBookStart + 1;

// Physical layout constants — units are metres matching the scene scale.
// Brief §5.3: 0.022 m thick, 0.20 m wide, 0.16 m deep. The thickness drives
// the vertical pitch of the stack; width / depth are book-visual dimensions
// that live in `spine-design.ts`.
export const BOOK_GAP = 0.004; // legacy 4 mm between spines (unused in P10-10)
export const BOOK_THICKNESS = 0.022;

// Desk centre at [0, 0.75, 0] with top surface at y ≈ 0.79. The stack sits
// in the front-right empty desk space, clear of the skills-catalog drawer
// at (0.45, _, -0.15) and the lamp base at (0.65, _, -0.25). The
// front-forward position also reads as intentionally placed at the reading
// edge of the desk — same reading logic as the contact card row.
export const STACK_CENTER_X = 0.5;
export const STACK_Z = 0.15;
export const STACK_BOTTOM_Y = 0.79;

/**
 * Yaw pattern: alternating +YAW/-YAW per book. Uniform yaw would hide every
 * spine colour behind the book in front; alternating rocks the stack so both
 * even and odd spines catch the lamp from opposite sides — simple rule, more
 * colour variance than a uniform tilt, documented here so the artist-brief
 * closeout can reproduce it.
 *
 * Applied around the world Y (vertical) axis: with books authored flat per
 * artist brief §5.3.1 (X spine-length, Y thickness, Z page-width), a Y-yaw
 * rotates each book around the vertical in the stack — spines catch
 * different glances of light without disturbing the stack-up pitch.
 */
export const YAW_DEG = 8;
export const yawForIndex = (i: number): number =>
  ((i % 2 === 0 ? 1 : -1) * YAW_DEG * Math.PI) / 180;

/**
 * World-space Y for the i-th book in the stack. Book 0 rests on the desk
 * surface (centre = surface + half-thickness); each subsequent book sits
 * directly on top of the one below.
 */
export const bookYForIndex = (i: number): number =>
  STACK_BOTTOM_Y + i * BOOK_THICKNESS + BOOK_THICKNESS / 2;
