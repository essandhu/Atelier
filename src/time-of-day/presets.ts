import * as THREE from 'three';
import type { TimeOfDayState } from './types';

export interface ColorGradePreset {
  hue: number;
  saturation: number;
  brightness: number;
  contrast: number;
}

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
  colorGrade: ColorGradePreset;
}

/* Evening is the phase-2 reference tuning — do not edit without re-baking. */
const evening: TimeOfDayPreset = {
  lightmap: '/scene/lightmaps/evening.ktx2',
  windowColor: new THREE.Color('#f7a062'),
  windowIntensity: 0.7,
  lampIntensity: 1.4,
  lampEmissionStrength: 1.1,
  bloomStrength: 0.9,
  bloomFocus: 'both',
  ambientTint: new THREE.Color('#2a1d18'),
  dustMoteOpacity: 0.35,
  liveActivityEmissionWarmth: 0.4,
  colorGrade: {
    hue: -0.05,
    saturation: 0.12,
    brightness: 0.0,
    contrast: 0.08,
  },
};

const morning: TimeOfDayPreset = {
  lightmap: '/scene/lightmaps/morning.ktx2',
  windowColor: new THREE.Color('#c8d9f0'),
  windowIntensity: 0.85,
  lampIntensity: 0.55,
  lampEmissionStrength: 0.5,
  bloomStrength: 0.5,
  bloomFocus: 'window',
  ambientTint: new THREE.Color('#1c2230'),
  dustMoteOpacity: 0.25,
  liveActivityEmissionWarmth: -0.15,
  colorGrade: {
    hue: 0.05,
    saturation: -0.1,
    brightness: 0.05,
    contrast: 0.0,
  },
};

const day: TimeOfDayPreset = {
  lightmap: '/scene/lightmaps/day.ktx2',
  windowColor: new THREE.Color('#eaf0f7'),
  windowIntensity: 1.1,
  lampIntensity: 0.3,
  lampEmissionStrength: 0.25,
  bloomStrength: 0.3,
  bloomFocus: 'window',
  ambientTint: new THREE.Color('#252a31'),
  dustMoteOpacity: 0.2,
  liveActivityEmissionWarmth: 0,
  colorGrade: {
    hue: 0.0,
    saturation: 0.0,
    brightness: 0.02,
    contrast: -0.05,
  },
};

const night: TimeOfDayPreset = {
  lightmap: '/scene/lightmaps/night.ktx2',
  windowColor: new THREE.Color('#1a1e2a'),
  windowIntensity: 0.12,
  lampIntensity: 1.6,
  lampEmissionStrength: 1.3,
  bloomStrength: 1.1,
  bloomFocus: 'lamp',
  ambientTint: new THREE.Color('#120f16'),
  dustMoteOpacity: 0.4,
  liveActivityEmissionWarmth: 0.5,
  colorGrade: {
    hue: 0.04,
    saturation: 0.08,
    brightness: -0.05,
    contrast: 0.12,
  },
};

export const presets: Record<TimeOfDayState, TimeOfDayPreset> = {
  morning,
  day,
  evening,
  night,
};
