import * as THREE from 'three';
import type { TimeOfDayState } from './types';

export interface TimeOfDayPreset {
  lightmap: string;
  windowColor: THREE.Color;
  windowIntensity: number;
  lampIntensity: number;
  lampEmissionStrength: number;
  bloomStrength: number;
  bloomFocus: 'lamp' | 'window' | 'both';
  ambientTint: THREE.Color;
  dustMoteOpacity: number;
  liveActivityEmissionWarmth: number;
}

const evening: TimeOfDayPreset = {
  lightmap: '/scene/lightmaps/evening.ktx2',
  windowColor: new THREE.Color('#f7a062'),
  windowIntensity: 0.7,
  lampIntensity: 1.4,
  lampEmissionStrength: 1.1,
  bloomStrength: 0.9,
  bloomFocus: 'lamp',
  ambientTint: new THREE.Color('#2a1d18'),
  dustMoteOpacity: 0.35,
  liveActivityEmissionWarmth: 0.4,
};

// Morning / day / night entries are placeholders. Phase 5 tunes them when
// the corresponding lightmaps are baked. Keeping them structurally present
// preserves Record<TimeOfDayState, _> totality so consumers don't need
// optional-chained reads.
const placeholder = (lightmap: string): TimeOfDayPreset => ({
  lightmap,
  windowColor: new THREE.Color('#ffffff'),
  windowIntensity: 1,
  lampIntensity: 1,
  lampEmissionStrength: 1,
  bloomStrength: 0.5,
  bloomFocus: 'both',
  ambientTint: new THREE.Color('#202020'),
  dustMoteOpacity: 0.2,
  liveActivityEmissionWarmth: 0,
});

export const presets: Record<TimeOfDayState, TimeOfDayPreset> = {
  morning: placeholder('/scene/lightmaps/morning.ktx2'),
  day: placeholder('/scene/lightmaps/day.ktx2'),
  evening,
  night: placeholder('/scene/lightmaps/night.ktx2'),
};
