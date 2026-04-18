import { presets, type ColorGradePreset } from '@/time-of-day/presets';
import type { TimeOfDayState } from '@/time-of-day/types';

export interface EffectsParams {
  bloomStrength: number;
  luminanceThreshold: number;
  caOffset: [number, number];
  noiseOpacity: number;
  noiseAnimated: boolean;
  colorGrade: ColorGradePreset;
}

/* Base CA offset for evening/night. Morning and day taper to ~40%. */
const CA_BASE: [number, number] = [0.0006, 0.0012];

const caScaleFor = (state: TimeOfDayState): number => {
  if (state === 'morning' || state === 'day') return 0.4;
  return 1.0;
};

const luminanceThresholdFor = (
  focus: 'lamp' | 'window' | 'both',
): number => {
  if (focus === 'lamp') return 0.85;
  if (focus === 'window') return 0.6;
  return 0.5;
};

const baseNoiseOpacity = 0.06;

export const effectsParamsFor = (
  state: TimeOfDayState,
  reducedMotion: boolean,
): EffectsParams => {
  const preset = presets[state];
  const caScale = caScaleFor(state);
  const noiseOpacity = reducedMotion ? baseNoiseOpacity * 0.5 : baseNoiseOpacity;
  return {
    bloomStrength: preset.bloomStrength,
    luminanceThreshold: luminanceThresholdFor(preset.bloomFocus),
    caOffset: [CA_BASE[0] * caScale, CA_BASE[1] * caScale],
    noiseOpacity,
    noiseAnimated: !reducedMotion,
    colorGrade: preset.colorGrade,
  };
};
