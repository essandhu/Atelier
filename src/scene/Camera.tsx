'use client';

import { PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { useIsNarrowViewport } from '@/lib/use-narrow-viewport';

interface CameraProps {
  parallaxOffset?: THREE.Vector3;
}

const BASE_POSITION: [number, number, number] = [0, 1.5, 2.2];
const LOOK_AT: [number, number, number] = [0, 0.9, 0];
const NARROW_Z_SCALE = 0.88; // pulls ~12% closer
const BASE_FOV = 35;
const NARROW_FOV = 39; // +4° on narrow viewports

export const Camera = ({ parallaxOffset }: CameraProps): React.ReactElement => {
  const narrow = useIsNarrowViewport();
  const basePosition: [number, number, number] = narrow
    ? [BASE_POSITION[0], BASE_POSITION[1], BASE_POSITION[2] * NARROW_Z_SCALE]
    : BASE_POSITION;
  const position: [number, number, number] = parallaxOffset
    ? [
        basePosition[0] + parallaxOffset.x,
        basePosition[1] + parallaxOffset.y,
        basePosition[2] + parallaxOffset.z,
      ]
    : basePosition;
  return (
    <PerspectiveCamera
      makeDefault
      position={position}
      fov={narrow ? NARROW_FOV : BASE_FOV}
      near={0.1}
      far={50}
      onUpdate={(cam) => cam.lookAt(...LOOK_AT)}
    />
  );
};
