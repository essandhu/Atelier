/**
 * Pure math: face pose → camera parallax offset.
 *
 * Dead-zone + clamp + one-euro smoothing. The dead-zone + clamp combination
 * makes parallax read as "subtle" — the one-euro filter removes jitter while
 * preserving fast-motion responsiveness (slow moves get heavier smoothing,
 * fast ones get less, which is the whole point of the adaptive cutoff).
 *
 * Reference: Casiez, Roussel, Vogel — "1€ Filter: A Simple Speed-based Low-pass
 * Filter for Noisy Input in Interactive Systems" (CHI 2012).
 */

export interface Pose {
  /** radians */
  yaw: number;
  /** radians */
  pitch: number;
  /** meters from camera */
  depth: number;
}

export interface Offset {
  x: number;
  y: number;
  z: number;
}

export const YAW_DEAD_ZONE = 0.04; // ~2.3°
export const PITCH_DEAD_ZONE = 0.04;
export const X_GAIN = 0.35;
export const X_LIMIT = 0.18;
export const Y_GAIN = 0.3;
export const Y_LIMIT = 0.12;
export const Z_GAIN = 0.2;
export const Z_LIMIT = 0.1;
export const DEPTH_REST = 0.55;

export interface OneEuroParams {
  minCutoff: number;
  beta: number;
  dCutoff: number;
}

export interface OneEuroState {
  xPrev: number | null;
  dxPrev: number;
  tPrev: number;
}

const clamp = (v: number, lo: number, hi: number): number =>
  v < lo ? lo : v > hi ? hi : v;

const applyDeadZone = (v: number, dz: number): number =>
  Math.abs(v) < dz ? 0 : v;

const alpha = (dt: number, cutoff: number): number => {
  const tau = 1 / (2 * Math.PI * cutoff);
  return 1 / (1 + tau / dt);
};

/**
 * One-Euro filter single-channel step. Mutates the state ref and returns the
 * filtered value. `t` is an absolute timestamp (seconds); dt is computed
 * internally so callers don't need to track it separately.
 */
export const applyOneEuro = (
  raw: number,
  state: OneEuroState,
  t: number,
  params: OneEuroParams,
): number => {
  if (state.xPrev === null) {
    state.xPrev = raw;
    state.dxPrev = 0;
    state.tPrev = t;
    return raw;
  }
  const dt = Math.max(1e-6, t - state.tPrev);
  const dx = (raw - state.xPrev) / dt;
  const aD = alpha(dt, params.dCutoff);
  const dxHat = aD * dx + (1 - aD) * state.dxPrev;
  const cutoff = params.minCutoff + params.beta * Math.abs(dxHat);
  const aX = alpha(dt, cutoff);
  const xHat = aX * raw + (1 - aX) * state.xPrev;
  state.xPrev = xHat;
  state.dxPrev = dxHat;
  state.tPrev = t;
  return xHat;
};

// Per-channel filter state. Module-scoped so a single FaceTracker session's
// successive poseToOffset calls share smoothing. Callers owning multiple
// independent sessions should use `createPoseFilter()` directly.
const createChannel = (): OneEuroState => ({
  xPrev: null,
  dxPrev: 0,
  tPrev: 0,
});

export interface PoseFilter {
  x: OneEuroState;
  y: OneEuroState;
  z: OneEuroState;
  t: number;
}

export const createPoseFilter = (): PoseFilter => ({
  x: createChannel(),
  y: createChannel(),
  z: createChannel(),
  t: 0,
});

const sharedFilter: PoseFilter = createPoseFilter();

const DEFAULT_PARAMS: OneEuroParams = {
  minCutoff: 1,
  beta: 0.01,
  dCutoff: 1,
};

/**
 * `prev` is accepted for API parity with the architecture-doc signature but
 * is unused — smoothing state lives inside the module-scoped filter because
 * the one-euro algorithm needs both x_prev AND dx_prev, not just the last
 * emitted offset. `dt` is used to advance the filter clock.
 */
export const poseToOffset = (
  pose: Pose,
  _prev: Offset,
  dt: number,
  filter: PoseFilter = sharedFilter,
  params: OneEuroParams = DEFAULT_PARAMS,
): Offset => {
  const yaw = applyDeadZone(pose.yaw, YAW_DEAD_ZONE);
  const pitch = applyDeadZone(pose.pitch, PITCH_DEAD_ZONE);
  const rawX = clamp(yaw * X_GAIN, -X_LIMIT, X_LIMIT);
  const rawY = clamp(pitch * Y_GAIN, -Y_LIMIT, Y_LIMIT);
  const rawZ = clamp((pose.depth - DEPTH_REST) * Z_GAIN, -Z_LIMIT, Z_LIMIT);
  filter.t += dt;
  const x = applyOneEuro(rawX, filter.x, filter.t, params);
  const y = applyOneEuro(rawY, filter.y, filter.t, params);
  const z = applyOneEuro(rawZ, filter.z, filter.t, params);
  return { x, y, z };
};
