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

  describe('per-state tuning (P5-03)', () => {
    it('morning lamp is dimmer than evening lamp', () => {
      expect(presets.morning.lampIntensity).toBeLessThan(
        presets.evening.lampIntensity,
      );
      expect(presets.morning.lampIntensity).toBeLessThanOrEqual(
        presets.evening.lampIntensity / 2,
      );
    });

    it('day window is brighter than evening window', () => {
      expect(presets.day.windowIntensity).toBeGreaterThan(
        presets.evening.windowIntensity,
      );
    });

    it('night bloom is stronger than evening bloom', () => {
      expect(presets.night.bloomStrength).toBeGreaterThan(
        presets.evening.bloomStrength,
      );
    });

    it('night keeps bloomFocus on the lamp', () => {
      expect(presets.night.bloomFocus).toBe('lamp');
    });

    it('morning and day focus bloom on the window', () => {
      expect(presets.morning.bloomFocus).toBe('window');
      expect(presets.day.bloomFocus).toBe('window');
    });

    it('night has more dust-mote density than day', () => {
      expect(presets.night.dustMoteOpacity).toBeGreaterThan(
        presets.day.dustMoteOpacity,
      );
    });

    it('morning leans cool, night leans warm for live-activity emission', () => {
      expect(presets.morning.liveActivityEmissionWarmth).toBeLessThan(0);
      expect(presets.night.liveActivityEmissionWarmth).toBeGreaterThan(0.3);
    });

    it('each of the four presets has a distinct lightmap url', () => {
      const urls = new Set([
        presets.morning.lightmap,
        presets.day.lightmap,
        presets.evening.lightmap,
        presets.night.lightmap,
      ]);
      expect(urls.size).toBe(4);
    });
  });
});
