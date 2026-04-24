'use client';

// Camera-dock spring driver (§5.5). Pure-math `step()` + thin R3F hook.
//
// Motion model: critically-damped harmonic oscillator with τ (tau) ≈ 200 ms.
// The effective settle window lands at ~3.5τ ≈ 700 ms — matching
// `durations.cameraDock` in `@/ui/motion/tokens`. We integrate with a
// symplectic-Euler step on the acceleration:
//   a = (target - x) / τ² − (2 · v) / τ
//   v_new = v + a · dt
//   x_new = x + v_new · dt
// This form is stable for any dt ≤ ~2τ; we still cap dt at 100 ms as a
// defensive measure (backgrounded-tab resume otherwise ships a single huge
// dt the first frame).
//
// Rotation is driven with the same spring, component-wise on Euler angles.
// We do not interpolate as a quaternion — dock targets are small (<±30°)
// and authored component-wise in `poses.ts`, so per-axis easing reads the
// same as quaternion SLERP within tolerance.
//
// Settle criterion (ε = 0.001): distance(x, target) < ε AND |v| < ε. Both
// position and rotation must satisfy independently.
//
// Reduced-motion path (§11.5 "Dock → single-frame snap to pose"): return
// target pose, zero velocity, settled = true.

import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type * as THREE from 'three';
import { sceneStore, type PanelPhase } from '@/store/scene-store';

export interface DockState {
  position: [number, number, number];
  rotation: [number, number, number];
  velocityPosition: [number, number, number];
  velocityRotation: [number, number, number];
  settled: boolean;
}

export interface DockTarget {
  position: readonly [number, number, number];
  rotation: readonly [number, number, number];
}

// Spring constants — τ = 0.2 s, damping ratio = 1 (critically damped).
const TAU_SECONDS = 0.2;
const EPSILON = 0.001; // metres (and radians) for both distance + velocity
const DT_CAP_MS = 100; // clamp extremely large frame gaps

// Which phases drive the spring. `docking` heads toward the pose; `closing`
// heads toward the home state (caller supplies the target). Other phases
// are no-ops — the driver freezes state.
const DRIVING_PHASES: readonly PanelPhase[] = ['docking', 'closing'];

export const makeInitialState = (
  position: readonly [number, number, number],
  rotation: readonly [number, number, number],
): DockState => ({
  position: [position[0], position[1], position[2]],
  rotation: [rotation[0], rotation[1], rotation[2]],
  velocityPosition: [0, 0, 0],
  velocityRotation: [0, 0, 0],
  settled: false,
});

const cloneState = (s: DockState): DockState => ({
  position: [s.position[0], s.position[1], s.position[2]],
  rotation: [s.rotation[0], s.rotation[1], s.rotation[2]],
  velocityPosition: [
    s.velocityPosition[0],
    s.velocityPosition[1],
    s.velocityPosition[2],
  ],
  velocityRotation: [
    s.velocityRotation[0],
    s.velocityRotation[1],
    s.velocityRotation[2],
  ],
  settled: s.settled,
});

const stepAxis = (
  x: number,
  v: number,
  target: number,
  dtSec: number,
): [number, number] => {
  // Critically-damped spring: a = (target - x) / τ² − 2v/τ
  const accel = (target - x) / (TAU_SECONDS * TAU_SECONDS) - (2 * v) / TAU_SECONDS;
  const vNew = v + accel * dtSec;
  const xNew = x + vNew * dtSec;
  return [xNew, vNew];
};

const magnitude3 = (v: readonly number[]): number =>
  Math.hypot(v[0] ?? 0, v[1] ?? 0, v[2] ?? 0);

const distance3 = (
  a: readonly number[],
  b: readonly number[],
): number => {
  const dx = (a[0] ?? 0) - (b[0] ?? 0);
  const dy = (a[1] ?? 0) - (b[1] ?? 0);
  const dz = (a[2] ?? 0) - (b[2] ?? 0);
  return Math.hypot(dx, dy, dz);
};

/**
 * Pure-math integration. Freezes state when `phase` is supplied but not in
 * {docking, closing}; a consumer that wants to always integrate can omit it.
 */
export const step = (
  state: DockState,
  dtMs: number,
  target: DockTarget,
  reducedMotion: boolean,
  phase?: PanelPhase,
): DockState => {
  if (phase !== undefined && !DRIVING_PHASES.includes(phase)) {
    return cloneState(state);
  }

  if (reducedMotion) {
    return {
      position: [target.position[0], target.position[1], target.position[2]],
      rotation: [target.rotation[0], target.rotation[1], target.rotation[2]],
      velocityPosition: [0, 0, 0],
      velocityRotation: [0, 0, 0],
      settled: true,
    };
  }

  if (dtMs <= 0) return cloneState(state);

  const dtSec = Math.min(dtMs, DT_CAP_MS) / 1000;

  const [px, pvx] = stepAxis(
    state.position[0],
    state.velocityPosition[0],
    target.position[0],
    dtSec,
  );
  const [py, pvy] = stepAxis(
    state.position[1],
    state.velocityPosition[1],
    target.position[1],
    dtSec,
  );
  const [pz, pvz] = stepAxis(
    state.position[2],
    state.velocityPosition[2],
    target.position[2],
    dtSec,
  );

  const [rx, rvx] = stepAxis(
    state.rotation[0],
    state.velocityRotation[0],
    target.rotation[0],
    dtSec,
  );
  const [ry, rvy] = stepAxis(
    state.rotation[1],
    state.velocityRotation[1],
    target.rotation[1],
    dtSec,
  );
  const [rz, rvz] = stepAxis(
    state.rotation[2],
    state.velocityRotation[2],
    target.rotation[2],
    dtSec,
  );

  const position: [number, number, number] = [px, py, pz];
  const rotation: [number, number, number] = [rx, ry, rz];
  const velocityPosition: [number, number, number] = [pvx, pvy, pvz];
  const velocityRotation: [number, number, number] = [rvx, rvy, rvz];

  const posClose = distance3(position, target.position) < EPSILON;
  const rotClose =
    Math.abs(rotation[0] - target.rotation[0]) < EPSILON &&
    Math.abs(rotation[1] - target.rotation[1]) < EPSILON &&
    Math.abs(rotation[2] - target.rotation[2]) < EPSILON;
  const posVelLow = magnitude3(velocityPosition) < EPSILON;
  const rotVelLow = magnitude3(velocityRotation) < EPSILON;

  const settled = posClose && rotClose && posVelLow && rotVelLow;

  return {
    position: settled
      ? [target.position[0], target.position[1], target.position[2]]
      : position,
    rotation: settled
      ? [target.rotation[0], target.rotation[1], target.rotation[2]]
      : rotation,
    velocityPosition: settled ? [0, 0, 0] : velocityPosition,
    velocityRotation: settled ? [0, 0, 0] : velocityRotation,
    settled,
  };
};

// --- R3F hook (thin shell over `step`) -------------------------------------

export interface DockHookPose {
  position: readonly [number, number, number];
  rotation: readonly [number, number, number];
}

/**
 * Mutates the supplied object ref's position/rotation each frame. When the
 * spring crosses ε in the `docking` phase, invokes `sceneStore.settleDock()`.
 *
 * Reads the scene phase via `sceneStore.getState()` (no render subscription)
 * so the hook does not rerender on phase changes — §5.1 concurrency model.
 *
 * `isActive` routes the dock animation to the single object that owns the
 * active panel. Without this gate every dockable mount animates toward its
 * own pose whenever ANY panel opens — each caller subscribes independently
 * so the driver has no other way to discriminate. Passive objects stay
 * pinned at their home pose so initial composition is preserved across
 * open/close cycles.
 */
export const useDockDriver = (
  objectRef: React.RefObject<THREE.Object3D | null>,
  pose: DockHookPose,
  homePose: DockHookPose,
  reducedMotion: boolean,
  isActive: boolean,
): void => {
  const stateRef = useRef<DockState>(
    makeInitialState(homePose.position, homePose.rotation),
  );

  // On mount, seed state from current object transform so mid-scene remounts
  // don't snap back to zero.
  useEffect(() => {
    const obj = objectRef.current;
    if (!obj) return;
    stateRef.current = makeInitialState(
      [obj.position.x, obj.position.y, obj.position.z],
      [obj.rotation.x, obj.rotation.y, obj.rotation.z],
    );
  }, [objectRef]);

  useFrame((_, delta) => {
    const obj = objectRef.current;
    if (!obj) return;

    // Passive objects freeze at home: pin the transform + keep stateRef
    // aligned so the next activation starts from home (not a stale pose).
    if (!isActive) {
      obj.position.set(homePose.position[0], homePose.position[1], homePose.position[2]);
      obj.rotation.set(homePose.rotation[0], homePose.rotation[1], homePose.rotation[2]);
      stateRef.current = makeInitialState(homePose.position, homePose.rotation);
      stateRef.current.settled = true;
      return;
    }

    const phase = sceneStore.getState().phase;
    // Target flips between the pose (docking) and home (closing). Other
    // phases freeze the driver.
    const target: DockTarget =
      phase === 'closing'
        ? { position: homePose.position, rotation: homePose.rotation }
        : { position: pose.position, rotation: pose.rotation };

    const prev = stateRef.current;
    const next = step(prev, delta * 1000, target, reducedMotion, phase);
    stateRef.current = next;

    obj.position.set(next.position[0], next.position[1], next.position[2]);
    obj.rotation.set(next.rotation[0], next.rotation[1], next.rotation[2]);

    // Settle dispatch — only in the `docking` phase, and only on the
    // transition frame (edge-trigger via `settled` flip). `settleDock()`
    // advances docking → docked; we immediately chain into `startOpening`
    // so the `<Html transform>` surface can mount in the `opening` phase
    // without a stuck-at-docked hole in the phase machine. The PanelFrame
    // / panel body owns the `opening → open` handoff via its own timer.
    if (next.settled && !prev.settled && phase === 'docking') {
      sceneStore.getState().settleDock();
      sceneStore.getState().startOpening();
    }
  });
};
