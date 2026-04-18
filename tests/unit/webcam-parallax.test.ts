import { beforeEach, describe, expect, it } from 'vitest';
import {
  poseToOffset,
  applyOneEuro,
  createPoseFilter,
  X_LIMIT,
  Y_LIMIT,
  Z_LIMIT,
  DEPTH_REST,
  type Pose,
  type Offset,
  type OneEuroState,
  type PoseFilter,
} from '@/interaction/webcam/parallax';

const zero: Offset = { x: 0, y: 0, z: 0 };
const neutral: Pose = { yaw: 0, pitch: 0, depth: DEPTH_REST };

describe('poseToOffset', () => {
  let filter: PoseFilter;
  beforeEach(() => {
    filter = createPoseFilter();
  });

  it('returns ~zero offset on neutral pose', () => {
    const out = poseToOffset(neutral, zero, 1 / 60, filter);
    expect(Math.abs(out.x)).toBeLessThan(1e-6);
    expect(Math.abs(out.y)).toBeLessThan(1e-6);
    expect(Math.abs(out.z)).toBeLessThan(1e-6);
  });

  it('yaw inside dead-zone returns 0 on x', () => {
    const out = poseToOffset(
      { yaw: 0.02, pitch: 0, depth: DEPTH_REST },
      zero,
      1 / 60,
      filter,
    );
    expect(out.x).toBe(0);
  });

  it('pitch inside dead-zone returns 0 on y', () => {
    const out = poseToOffset(
      { yaw: 0, pitch: 0.02, depth: DEPTH_REST },
      zero,
      1 / 60,
      filter,
    );
    expect(out.y).toBe(0);
  });

  it('large yaw clamps to +X_LIMIT', () => {
    const out = poseToOffset(
      { yaw: 5, pitch: 0, depth: DEPTH_REST },
      zero,
      1 / 60,
      filter,
    );
    expect(out.x).toBeCloseTo(X_LIMIT, 5);
  });

  it('large negative yaw clamps to -X_LIMIT', () => {
    const out = poseToOffset(
      { yaw: -5, pitch: 0, depth: DEPTH_REST },
      zero,
      1 / 60,
      filter,
    );
    expect(out.x).toBeCloseTo(-X_LIMIT, 5);
  });

  it('large pitch clamps to ±Y_LIMIT', () => {
    const pos = poseToOffset(
      { yaw: 0, pitch: 5, depth: DEPTH_REST },
      zero,
      1 / 60,
      createPoseFilter(),
    );
    const neg = poseToOffset(
      { yaw: 0, pitch: -5, depth: DEPTH_REST },
      zero,
      1 / 60,
      createPoseFilter(),
    );
    expect(pos.y).toBeCloseTo(Y_LIMIT, 5);
    expect(neg.y).toBeCloseTo(-Y_LIMIT, 5);
  });

  it('depth at rest returns 0 on z', () => {
    const out = poseToOffset(
      { yaw: 0, pitch: 0, depth: DEPTH_REST },
      zero,
      1 / 60,
      filter,
    );
    expect(out.z).toBe(0);
  });

  it('depth swing clamps to ±Z_LIMIT', () => {
    const close = poseToOffset(
      { yaw: 0, pitch: 0, depth: DEPTH_REST - 5 },
      zero,
      1 / 60,
      createPoseFilter(),
    );
    const far = poseToOffset(
      { yaw: 0, pitch: 0, depth: DEPTH_REST + 5 },
      zero,
      1 / 60,
      createPoseFilter(),
    );
    expect(close.z).toBeCloseTo(-Z_LIMIT, 5);
    expect(far.z).toBeCloseTo(Z_LIMIT, 5);
  });

  it('smoothing is applied — step input produces a ramp after the first sample', () => {
    // Seed the filter with a zero baseline, then step.
    poseToOffset(neutral, zero, 1 / 60, filter);
    const target = { yaw: 0.5, pitch: 0, depth: DEPTH_REST };
    const step1 = poseToOffset(target, zero, 1 / 60, filter);
    const step2 = poseToOffset(target, step1, 1 / 60, filter);
    const step3 = poseToOffset(target, step2, 1 / 60, filter);
    // After a seed, subsequent samples should not jump directly to the clamped
    // target value — each step should advance partway.
    expect(step1.x).toBeGreaterThan(0);
    expect(step1.x).toBeLessThan(X_LIMIT);
    expect(step2.x).toBeGreaterThan(step1.x);
    expect(step3.x).toBeGreaterThan(step2.x);
  });
});

describe('applyOneEuro', () => {
  it('first sample returns the raw input (initialization)', () => {
    const state: OneEuroState = { xPrev: null, dxPrev: 0, tPrev: 0 };
    const v = applyOneEuro(1, state, 0, {
      minCutoff: 1,
      beta: 0.01,
      dCutoff: 1,
    });
    expect(v).toBe(1);
  });

  it('reduces a step-function input to a damped ramp once initialized', () => {
    const state: OneEuroState = { xPrev: null, dxPrev: 0, tPrev: 0 };
    let t = 0;
    // Seed at zero so the subsequent samples targeting 1 must ramp.
    applyOneEuro(0, state, t, { minCutoff: 1, beta: 0.01, dCutoff: 1 });
    const samples: number[] = [];
    for (let i = 0; i < 20; i++) {
      t += 1 / 60;
      samples.push(
        applyOneEuro(1, state, t, {
          minCutoff: 1,
          beta: 0.01,
          dCutoff: 1,
        }),
      );
    }
    // Middle samples lie strictly between 0 (seed) and 1 (target)
    for (const s of samples.slice(0, 3)) {
      expect(s).toBeGreaterThan(0);
      expect(s).toBeLessThan(1);
    }
    // Monotonically non-decreasing
    for (let i = 1; i < samples.length; i++) {
      expect(samples[i]).toBeGreaterThanOrEqual(samples[i - 1] - 1e-9);
    }
  });
});
