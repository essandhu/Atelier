// Pure-math unit tests for the camera-dock spring driver (§5.5).
//
// Spring model: critically-damped harmonic oscillator with τ (tau) ≈ 0.2 s
// so that ~97% of the settle has occurred inside the §5.4
// `durations.cameraDock = 700 ms` window. Integrator is symplectic Euler
// with an internal dtMs cap of 100 ms (to keep a backgrounded-tab resume
// from exploding the spring).
//
// The driver's pure `step()` is phase-agnostic when `phase` is omitted; when
// supplied, it no-ops on phases that do not drive (`closed`, `docked`,
// `opening`, `open`). `docking` drives toward the pose; `closing` drives
// toward the home state passed in by the consumer.
//
// Settle criterion (ε = 0.001 m):
//   - distance(position, target) < ε AND velocity magnitude < ε
//   - scalars only — rotation settles independently.

import { describe, expect, it } from 'vitest';
import {
  step,
  makeInitialState,
  type DockState,
  type DockTarget,
} from '@/interaction/camera-dock/driver';

const HOME_POSITION: [number, number, number] = [0, 0, 0];
const HOME_ROTATION: [number, number, number] = [0, 0, 0];

const makeTarget = (
  position: [number, number, number],
  rotation: [number, number, number] = [0, 0, 0],
): DockTarget => ({ position, rotation });

const vecLen = (v: readonly number[]): number =>
  Math.hypot(v[0] ?? 0, v[1] ?? 0, v[2] ?? 0);

const distance = (
  a: readonly number[],
  b: readonly number[],
): number => {
  const dx = (a[0] ?? 0) - (b[0] ?? 0);
  const dy = (a[1] ?? 0) - (b[1] ?? 0);
  const dz = (a[2] ?? 0) - (b[2] ?? 0);
  return Math.hypot(dx, dy, dz);
};

describe('camera-dock driver / step()', () => {
  it('is a no-op when phase is not docking/closing', () => {
    const state = makeInitialState(HOME_POSITION, HOME_ROTATION);
    const target = makeTarget([0, 1.3, 1.6]);
    const next = step(state, 16, target, false, 'closed');
    expect(next.position).toEqual(state.position);
    expect(next.rotation).toEqual(state.rotation);
    expect(next.velocityPosition).toEqual(state.velocityPosition);
    expect(next.settled).toBe(state.settled);

    const next2 = step(state, 16, target, false, 'open');
    expect(next2).toEqual(state);

    const next3 = step(state, 16, target, false, 'docked');
    expect(next3).toEqual(state);
  });

  it('moves position closer to target on a small step (not yet at target)', () => {
    const state = makeInitialState(HOME_POSITION, HOME_ROTATION);
    const target = makeTarget([0, 1.3, 1.6]);
    const d0 = distance(state.position, target.position);
    const next = step(state, 16, target, false, 'docking');
    const d1 = distance(next.position, target.position);
    expect(d1).toBeLessThan(d0);
    expect(d1).toBeGreaterThan(0); // not yet at target after 16ms
    expect(next.settled).toBe(false);
  });

  it('does not overshoot catastrophically on a single large step', () => {
    const state = makeInitialState(HOME_POSITION, HOME_ROTATION);
    const target = makeTarget([0, 1.3, 1.6]);
    const d0 = distance(state.position, target.position);
    // dtMs beyond the internal cap — driver must clamp so we don't blow up.
    const next = step(state, 5000, target, false, 'docking');
    // With critically-damped spring + clamp, |pos - target| must remain bounded
    // and strictly less than the initial distance.
    const d1 = distance(next.position, target.position);
    expect(Number.isFinite(d1)).toBe(true);
    expect(d1).toBeLessThan(d0);
    // An *absolute* overshoot bound: a critically-damped spring should not
    // exceed the initial distance even with a large dt (clamped).
    expect(d1).toBeLessThan(d0);
  });

  it('eventually settles inside ε after repeated stepping at 60fps', () => {
    let state = makeInitialState(HOME_POSITION, HOME_ROTATION);
    const target = makeTarget([0, 1.3, 1.6]);
    // Drive many frames at 16ms — well beyond the 700ms dock window.
    for (let i = 0; i < 200; i++) {
      state = step(state, 16, target, false, 'docking');
      if (state.settled) break;
    }
    expect(state.settled).toBe(true);
    expect(distance(state.position, target.position)).toBeLessThan(0.001);
    expect(vecLen(state.velocityPosition)).toBeLessThan(0.001);
  });

  it('reduced-motion path snaps to target in one step and marks settled', () => {
    const state = makeInitialState(HOME_POSITION, HOME_ROTATION);
    const target = makeTarget([0.12, 1.3, 1.6], [-0.26, 0, 0]);
    const next = step(state, 16, target, true, 'docking');
    expect(next.position).toEqual([...target.position]);
    expect(next.rotation).toEqual([...target.rotation]);
    expect(next.velocityPosition).toEqual([0, 0, 0]);
    expect(next.velocityRotation).toEqual([0, 0, 0]);
    expect(next.settled).toBe(true);
  });

  it('reverse path (closing) drives toward home from a dock position', () => {
    // Start settled at a pose, request close → home.
    let state: DockState = {
      position: [0, 1.3, 1.6],
      rotation: [-0.26, 0, 0],
      velocityPosition: [0, 0, 0],
      velocityRotation: [0, 0, 0],
      settled: true,
    };
    const home = makeTarget(HOME_POSITION, HOME_ROTATION);
    for (let i = 0; i < 200; i++) {
      state = step(state, 16, home, false, 'closing');
      if (state.settled) break;
    }
    expect(state.settled).toBe(true);
    expect(distance(state.position, HOME_POSITION)).toBeLessThan(0.001);
  });

  it('dtMs = 0 returns an unchanged snapshot', () => {
    const state = makeInitialState(HOME_POSITION, HOME_ROTATION);
    const target = makeTarget([0, 1.3, 1.6]);
    const next = step(state, 0, target, false, 'docking');
    expect(next.position).toEqual(state.position);
    expect(next.rotation).toEqual(state.rotation);
    expect(next.velocityPosition).toEqual(state.velocityPosition);
    expect(next.velocityRotation).toEqual(state.velocityRotation);
  });

  it('very large dtMs is clamped — result remains finite and bounded', () => {
    const state = makeInitialState(HOME_POSITION, HOME_ROTATION);
    const target = makeTarget([0, 1.3, 1.6]);
    const next = step(state, 100_000, target, false, 'docking');
    // With clamp at ≤100ms per integration, a single call can only progress
    // the spring by one clamped step — velocity + position must be finite.
    expect(Number.isFinite(next.position[0])).toBe(true);
    expect(Number.isFinite(next.position[1])).toBe(true);
    expect(Number.isFinite(next.position[2])).toBe(true);
    expect(Number.isFinite(next.velocityPosition[0])).toBe(true);
    // Magnitude bounded by initial distance (critically-damped → no overshoot).
    const d0 = distance(state.position, target.position);
    const d1 = distance(next.position, target.position);
    expect(d1).toBeLessThan(d0);
  });

  it('rotation converges independently of position', () => {
    // Position already at target; only rotation needs to move.
    let state: DockState = {
      position: [0, 1.3, 1.6],
      rotation: [0, 0, 0],
      velocityPosition: [0, 0, 0],
      velocityRotation: [0, 0, 0],
      settled: false,
    };
    const target = makeTarget([0, 1.3, 1.6], [-0.26, 0, 0]);
    for (let i = 0; i < 200; i++) {
      state = step(state, 16, target, false, 'docking');
      if (state.settled) break;
    }
    expect(state.settled).toBe(true);
    // Rotation should have converged within ε.
    expect(Math.abs(state.rotation[0] - target.rotation[0])).toBeLessThan(0.001);
    // Position was never perturbed (target equals start); stays fixed.
    expect(distance(state.position, target.position)).toBeLessThan(0.001);
  });

  it('identity step: already-at-target + zero velocity stays put and marks settled', () => {
    const state: DockState = {
      position: [0, 1.3, 1.6],
      rotation: [0, 0, 0],
      velocityPosition: [0, 0, 0],
      velocityRotation: [0, 0, 0],
      settled: false,
    };
    const target = makeTarget([0, 1.3, 1.6]);
    const next = step(state, 16, target, false, 'docking');
    expect(distance(next.position, target.position)).toBeLessThan(0.001);
    expect(vecLen(next.velocityPosition)).toBeLessThan(0.001);
    expect(next.settled).toBe(true);
  });

  it('settled = false while velocity > ε even if position is near target', () => {
    // Position is close but there is residual velocity — driver must not
    // claim settled prematurely.
    const state: DockState = {
      position: [0.00005, 1.3, 1.6], // ~0.00005 m away
      rotation: [0, 0, 0],
      velocityPosition: [0.5, 0, 0], // large residual velocity
      velocityRotation: [0, 0, 0],
      settled: false,
    };
    const target = makeTarget([0, 1.3, 1.6]);
    const next = step(state, 16, target, false, 'docking');
    expect(next.settled).toBe(false);
  });
});
