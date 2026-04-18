'use client';

import {
  BrightnessContrast,
  HueSaturation,
} from '@react-three/postprocessing';
import type { ColorGradePreset } from '@/time-of-day/presets';

export interface ColorGradeProps {
  params: ColorGradePreset;
}

export const ColorGrade = ({ params }: ColorGradeProps): React.ReactElement => (
  <>
    <HueSaturation hue={params.hue} saturation={params.saturation} />
    <BrightnessContrast
      brightness={params.brightness}
      contrast={params.contrast}
    />
  </>
);
