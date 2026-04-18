/**
 * Pure-math helpers for globe rotation dynamics.
 *
 * Form: exponential decay v(t) = v0 * e^{-λt}. Matches the DustMotes /
 * LampBreathe convention of keeping physics as pure functions so the React
 * consumer (`<Globe />`) is a thin shell around these helpers.
 */

/**
 * Slow idle rotation applied when no drag momentum remains — keeps the
 * globe visibly alive (BRIEF: "extremely slow idle rotation when not
 * being interacted with"). ~0.05 rad/s ≈ one full rotation per 2 minutes.
 */
export const IDLE_SPIN_RATE = 0.05;

/**
 * Pointer-drag pixels that map to one radian of rotation. Tuned so a
 * 250 ms, 120 px drag feels like a firm spin without running away.
 */
export const PIXELS_PER_RADIAN = 200;

/**
 * Apply one tick of exponential decay to the current angular velocity.
 * Returns `angularVelocity * exp(-decay * delta)`.
 */
export const stepMomentum = (
  angularVelocity: number,
  delta: number,
  decay: number,
): number => angularVelocity * Math.exp(-decay * delta);

/**
 * Convert a pointer-drag sample (pixel delta + duration in ms) into an
 * angular-velocity seed (rad/s). Zero-drag or zero-duration → zero.
 */
export const impartMomentumFromDrag = (
  dragDeltaX: number,
  dragDurationMs: number,
): number => {
  if (dragDurationMs <= 0) return 0;
  if (dragDeltaX === 0) return 0;
  const radians = dragDeltaX / PIXELS_PER_RADIAN;
  const seconds = dragDurationMs / 1000;
  return radians / seconds;
};
