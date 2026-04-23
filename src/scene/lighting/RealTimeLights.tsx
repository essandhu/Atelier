'use client';

import { presets } from '@/time-of-day/presets';
import type { TimeOfDayState } from '@/time-of-day/types';
import { LAMP_BULB_POSITION } from '@/scene/Lamp';
import { useLightmap } from '@/scene/lighting/Lightmaps';

interface RealTimeLightsProps {
  state: TimeOfDayState;
}

const AMBIENT_BASE_INTENSITY = 0.05;
// Pre-Phase-10 fallback: when the baked lightmap is absent the scene is
// otherwise near-black (ambient 0.05 + one point light). Bumped ambient +
// a hemisphere light restore enough fill for composition reference capture.
// Self-disables the moment real bakes land in /public/scene/lightmaps.
const AMBIENT_FALLBACK_INTENSITY = 0.7;
const HEMI_FALLBACK_INTENSITY = 0.5;

export const RealTimeLights = ({
  state,
}: RealTimeLightsProps): React.ReactElement => {
  const preset = presets[state];
  const lightmap = useLightmap();
  const fallback = lightmap === null;
  return (
    <>
      <ambientLight
        color={preset.ambientTint}
        intensity={fallback ? AMBIENT_FALLBACK_INTENSITY : AMBIENT_BASE_INTENSITY}
      />
      {fallback && (
        <hemisphereLight
          args={[
            preset.windowColor,
            preset.ambientTint,
            HEMI_FALLBACK_INTENSITY,
          ]}
        />
      )}
      <pointLight
        position={LAMP_BULB_POSITION}
        color={preset.windowColor}
        intensity={preset.lampIntensity}
        distance={6}
        decay={2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.0005}
      />
    </>
  );
};
