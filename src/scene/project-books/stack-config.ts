import { TAB_ORDER } from '@/interaction/tab-order';

/**
 * Single source of truth for the on-desk project-book stack geometry + cap.
 *
 * MAX_BOOKS is derived from TAB_ORDER so the numeric tabIndex range and the
 * visible stack size stay in lockstep — bump `projectBookMax` to grow the
 * stack and every consumer (ProjectBookStack slice, e2e Tab assertions,
 * docs) scales with it.
 */
export const MAX_BOOKS =
  TAB_ORDER.projectBookMax - TAB_ORDER.projectBookStart + 1;

// Physical layout constants — units are metres matching the scene scale.
export const BOOK_GAP = 0.004; // 4 mm between spines
export const STACK_CENTER_X = 0.48;
export const STACK_Z = -0.05;
