'use client';

import { useMemo } from 'react';
import {
  Bloom,
  ChromaticAberration,
  EffectComposer,
  Noise,
} from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import { effectsParamsFor } from '@/scene/post-processing/effects-tuning';
import type { TimeOfDayState } from '@/time-of-day/types';

export interface EffectsProps {
  state: TimeOfDayState;
  reducedMotion: boolean;
}

export const Effects = ({
  state,
  reducedMotion,
}: EffectsProps): React.ReactElement => {
  const params = effectsParamsFor(state, reducedMotion);
  const caOffset = useMemo(
    () => new THREE.Vector2(params.caOffset[0], params.caOffset[1]),
    [params.caOffset],
  );
  return (
    <EffectComposer>
      <Bloom
        intensity={params.bloomStrength}
        luminanceThreshold={params.luminanceThreshold}
        luminanceSmoothing={reducedMotion ? 0.1 : 0.3}
        mipmapBlur
      />
      <ChromaticAberration
        offset={caOffset}
        radialModulation={false}
        modulationOffset={0}
        blendFunction={BlendFunction.NORMAL}
      />
      <Noise
        opacity={params.noiseOpacity}
        blendFunction={BlendFunction.OVERLAY}
        premultiply
      />
    </EffectComposer>
  );
};
