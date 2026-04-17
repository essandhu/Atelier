'use client';

import {
  Bloom,
  ChromaticAberration,
  EffectComposer,
  Noise,
} from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import { presets } from '@/time-of-day/presets';
import type { TimeOfDayState } from '@/time-of-day/types';

export interface EffectsProps {
  state: TimeOfDayState;
  reducedMotion: boolean;
}

const CA_OFFSET = new THREE.Vector2(0.0006, 0.0012);

const luminanceThresholdFor = (focus: 'lamp' | 'window' | 'both'): number => {
  if (focus === 'lamp') return 0.85;
  if (focus === 'window') return 0.6;
  return 0.5;
};

export const Effects = ({
  state,
}: EffectsProps): React.ReactElement => {
  const preset = presets[state];
  return (
    <EffectComposer>
      <Bloom
        intensity={preset.bloomStrength}
        luminanceThreshold={luminanceThresholdFor(preset.bloomFocus)}
        luminanceSmoothing={0.3}
        mipmapBlur
      />
      <ChromaticAberration
        offset={CA_OFFSET}
        radialModulation={false}
        modulationOffset={0}
        blendFunction={BlendFunction.NORMAL}
      />
      <Noise opacity={0.06} blendFunction={BlendFunction.OVERLAY} premultiply />
    </EffectComposer>
  );
};
