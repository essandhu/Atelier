import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { presets } from '@/time-of-day/presets';
import type { TimeOfDayState } from '@/time-of-day/types';

describe('time-of-day presets', () => {
  it('exposes the evening lightmap path expected by Lightmaps.tsx', () => {
    expect(presets.evening.lightmap).toBe('/scene/lightmaps/evening.ktx2');
  });

  it('uses positive finite numbers for evening lamp + window intensities', () => {
    expect(Number.isFinite(presets.evening.lampIntensity)).toBe(true);
    expect(presets.evening.lampIntensity).toBeGreaterThan(0);
    expect(Number.isFinite(presets.evening.windowIntensity)).toBe(true);
    expect(presets.evening.windowIntensity).toBeGreaterThan(0);
  });

  it('limits evening bloomFocus to lamp | window | both', () => {
    expect(['lamp', 'window', 'both']).toContain(presets.evening.bloomFocus);
  });

  it('parses evening colors as THREE.Color instances', () => {
    expect(presets.evening.windowColor).toBeInstanceOf(THREE.Color);
    expect(presets.evening.ambientTint).toBeInstanceOf(THREE.Color);
  });

  it('is structurally total over TimeOfDayState', () => {
    const states: TimeOfDayState[] = ['morning', 'day', 'evening', 'night'];
    for (const state of states) {
      const entry = presets[state];
      expect(entry).toBeDefined();
      expect(entry.lightmap).toMatch(/^\/scene\/lightmaps\/.+\.ktx2$/);
      expect(entry.windowColor).toBeInstanceOf(THREE.Color);
      expect(typeof entry.lampIntensity).toBe('number');
      expect(typeof entry.bloomStrength).toBe('number');
      expect(entry.liveActivityEmissionWarmth).toBeGreaterThanOrEqual(-1);
      expect(entry.liveActivityEmissionWarmth).toBeLessThanOrEqual(1);
    }
  });
});
