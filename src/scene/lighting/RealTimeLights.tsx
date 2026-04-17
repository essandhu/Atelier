'use client';

import { presets } from '@/time-of-day/presets';
import type { TimeOfDayState } from '@/time-of-day/types';
import { LAMP_BULB_POSITION } from '@/scene/Lamp';

interface RealTimeLightsProps {
  state: TimeOfDayState;
}

const AMBIENT_BASE_INTENSITY = 0.05;

export const RealTimeLights = ({
  state,
}: RealTimeLightsProps): React.ReactElement => {
  const preset = presets[state];
  return (
    <>
      <ambientLight color={preset.ambientTint} intensity={AMBIENT_BASE_INTENSITY} />
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
