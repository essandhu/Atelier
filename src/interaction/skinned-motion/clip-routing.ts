// Pure-logic mapping: scene-store phase transitions → named clip actions.
//
// Kept separate from the React hook that drives the `AnimationMixer` so
// the routing rules can be unit-tested without R3F / three.js. The hook
// consumes `resolveClipAction(prev, next, isActive, hasClip)` on every
// phase change and executes the returned action against the mixer.
//
// The rules encode ADR-016's split: authored transitions (`open`,
// `close`) play on entering `docking` / `closing`; idle loops play on
// `open` when focused; everything else stays in bind pose.

import type { PanelPhase } from '@/store/scene-store';

/** Crossfade duration (seconds) applied on every clip transition. */
export const FADE_IN_SECONDS = 0.2;
export const FADE_OUT_SECONDS = 0.2;

export type ClipName =
  | 'open'
  | 'close'
  | 'idle'
  | 'hover'
  | 'pageFlip';

export type ClipAction =
  | { kind: 'none' }
  | { kind: 'play'; clip: ClipName; fadeInSec: number; loop: boolean }
  | { kind: 'stop'; clip: ClipName; fadeOutSec: number }
  | { kind: 'snap-to-end'; clip: ClipName };

export interface ClipContext {
  /** Previous scene phase, or null on first resolution. */
  prev: PanelPhase | null;
  /** Current scene phase. */
  next: PanelPhase;
  /** Whether this object currently owns the active panel. */
  isActive: boolean;
  /** `reducedMotion` from prefs-store. */
  reducedMotion: boolean;
  /** Which clip names the asset actually ships (from the GLB). */
  available: ReadonlySet<ClipName>;
}

/**
 * Returns the clip action to perform given a phase transition. The hook
 * dispatches this against the `AnimationMixer`.
 *
 * Rules:
 * - Reduced motion → never play forward. `open` clips snap to their
 *   end frame immediately when the object activates; `close` snaps to
 *   end on close. Loops (`idle`, `hover`) never run.
 * - Non-active object → never play the dock clips. Idle loop is
 *   allowed only on the currently-focused object.
 * - Missing clip → no-op. Assets may ship without optional clips
 *   (`idle`, `hover`, `pageFlip`); the adapter gracefully falls back
 *   to static + code-driven motion.
 */
export const resolveClipAction = (ctx: ClipContext): ClipAction => {
  const { prev, next, isActive, reducedMotion, available } = ctx;

  if (!isActive) {
    // Passive objects never play transition clips. They return to bind
    // pose when previously active.
    if (prev !== null && next === 'closed') {
      return available.has('open')
        ? { kind: 'stop', clip: 'open', fadeOutSec: FADE_OUT_SECONDS }
        : { kind: 'none' };
    }
    return { kind: 'none' };
  }

  // Active object — route transitions.
  if (prev !== 'docking' && next === 'docking') {
    if (!available.has('open')) return { kind: 'none' };
    if (reducedMotion) return { kind: 'snap-to-end', clip: 'open' };
    return {
      kind: 'play',
      clip: 'open',
      fadeInSec: FADE_IN_SECONDS,
      loop: false,
    };
  }

  if (prev !== 'closing' && next === 'closing') {
    if (!available.has('close')) return { kind: 'none' };
    if (reducedMotion) return { kind: 'snap-to-end', clip: 'close' };
    return {
      kind: 'play',
      clip: 'close',
      fadeInSec: FADE_IN_SECONDS,
      loop: false,
    };
  }

  // Entering `open` after the panel mounts — start the idle loop if the
  // asset ships one and motion is allowed.
  if (prev !== 'open' && next === 'open' && !reducedMotion) {
    if (!available.has('idle')) return { kind: 'none' };
    return {
      kind: 'play',
      clip: 'idle',
      fadeInSec: FADE_IN_SECONDS,
      loop: true,
    };
  }

  return { kind: 'none' };
};
