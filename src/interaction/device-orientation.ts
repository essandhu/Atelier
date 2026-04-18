/**
 * Pure math: `DeviceOrientationEvent` → camera parallax offset.
 *
 * Baseline-subtracted so the user's resting device angle is "zero parallax"
 * rather than requiring them to hold the phone perfectly flat.
 * Event values arrive in degrees; X_GAIN / Y_GAIN convert to the scene-unit
 * offset range consumed by the camera, and the clamps keep the effect subtle.
 */

export interface TiltEvent {
  alpha: number | null;
  beta: number | null;
  gamma: number | null;
}

export interface TiltBaseline {
  beta: number;
  gamma: number;
}

export interface TiltOffset {
  x: number;
  y: number;
  z: number;
}

export const X_GAIN = 0.005;
export const X_LIMIT = 0.15;
export const Y_GAIN = 0.005;
export const Y_LIMIT = 0.1;

const ZERO: TiltOffset = { x: 0, y: 0, z: 0 };

const clamp = (v: number, lo: number, hi: number): number =>
  v < lo ? lo : v > hi ? hi : v;

export const seedBaseline = (event: TiltEvent): TiltBaseline | null => {
  if (event.beta === null || event.gamma === null) return null;
  return { beta: event.beta, gamma: event.gamma };
};

export const tiltToOffset = (
  event: TiltEvent,
  baseline: TiltBaseline | null,
): TiltOffset => {
  if (baseline === null) return { ...ZERO };
  if (event.beta === null || event.gamma === null) return { ...ZERO };
  const dGamma = event.gamma - baseline.gamma;
  const dBeta = event.beta - baseline.beta;
  return {
    x: clamp(dGamma * X_GAIN, -X_LIMIT, X_LIMIT),
    y: clamp(dBeta * Y_GAIN, -Y_LIMIT, Y_LIMIT),
    z: 0,
  };
};
