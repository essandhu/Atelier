import { describe, expect, it } from 'vitest';
import { effectsParamsFor } from '@/scene/post-processing/effects-tuning';
import { presets } from '@/time-of-day/presets';
import type { TimeOfDayState } from '@/time-of-day/types';

const STATES: TimeOfDayState[] = ['morning', 'day', 'evening', 'night'];

describe('effectsParamsFor', () => {
  it('tapers chromatic aberration for morning and day', () => {
    const morning = effectsParamsFor('morning', false);
    const evening = effectsParamsFor('evening', false);
    const day = effectsParamsFor('day', false);
    const night = effectsParamsFor('night', false);

    expect(morning.caOffset[0]).toBeLessThan(evening.caOffset[0]);
    expect(day.caOffset[0]).toBeLessThan(evening.caOffset[0]);
    expect(morning.caOffset[0]).toBeLessThanOrEqual(evening.caOffset[0] * 0.5);
    expect(night.caOffset[0]).toBeGreaterThanOrEqual(evening.caOffset[0]);
  });

  it('orders bloom strength day ≤ morning < evening < night', () => {
    const byState = Object.fromEntries(
      STATES.map((s) => [s, effectsParamsFor(s, false)]),
    );
    expect(byState.day.bloomStrength).toBeLessThanOrEqual(
      byState.morning.bloomStrength,
    );
    expect(byState.morning.bloomStrength).toBeLessThan(
      byState.evening.bloomStrength,
    );
    expect(byState.evening.bloomStrength).toBeLessThan(
      byState.night.bloomStrength,
    );
  });

  it('reducedMotion lowers noise opacity for every state', () => {
    for (const s of STATES) {
      const normal = effectsParamsFor(s, false);
      const reduced = effectsParamsFor(s, true);
      expect(reduced.noiseOpacity).toBeLessThan(normal.noiseOpacity);
    }
  });

  it('reducedMotion disables noise animation', () => {
    expect(effectsParamsFor('night', true).noiseAnimated).toBe(false);
    expect(effectsParamsFor('night', false).noiseAnimated).toBe(true);
  });

  it('luminanceThreshold is higher when bloom focus is lamp', () => {
    const night = effectsParamsFor('night', false); // focus: lamp
    const day = effectsParamsFor('day', false); // focus: window
    expect(night.luminanceThreshold).toBeGreaterThan(day.luminanceThreshold);
  });

  it('caOffset components are both positive numbers', () => {
    for (const s of STATES) {
      const p = effectsParamsFor(s, false);
      expect(p.caOffset[0]).toBeGreaterThan(0);
      expect(p.caOffset[1]).toBeGreaterThan(0);
    }
  });

  describe('colorGrade (Phase 7)', () => {
    it('passes through the preset colorGrade per state', () => {
      for (const s of STATES) {
        expect(effectsParamsFor(s, false).colorGrade).toEqual(
          presets[s].colorGrade,
        );
      }
    });

    it('is independent of reducedMotion', () => {
      for (const s of STATES) {
        expect(effectsParamsFor(s, true).colorGrade).toEqual(
          effectsParamsFor(s, false).colorGrade,
        );
      }
    });
  });

  describe('bloom emphasis distribution (Phase 7)', () => {
    it('resolves evening to the balanced luminanceThreshold', () => {
      const evening = effectsParamsFor('evening', false);
      const night = effectsParamsFor('night', false);
      const morning = effectsParamsFor('morning', false);
      const day = effectsParamsFor('day', false);

      // 'lamp' → 0.85, 'window' → 0.6, 'both' → 0.5
      expect(evening.luminanceThreshold).toBe(0.5);
      expect(night.luminanceThreshold).toBe(0.85);
      expect(morning.luminanceThreshold).toBe(0.6);
      expect(day.luminanceThreshold).toBe(0.6);
    });
  });
});
