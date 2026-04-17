'use client';

import { PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

interface CameraProps {
  parallaxOffset?: THREE.Vector3;
}

const BASE_POSITION: [number, number, number] = [0, 1.5, 2.2];
const LOOK_AT: [number, number, number] = [0, 0.9, 0];

export const Camera = ({ parallaxOffset }: CameraProps): React.ReactElement => {
  const position: [number, number, number] = parallaxOffset
    ? [
        BASE_POSITION[0] + parallaxOffset.x,
        BASE_POSITION[1] + parallaxOffset.y,
        BASE_POSITION[2] + parallaxOffset.z,
      ]
    : BASE_POSITION;
  return (
    <PerspectiveCamera
      makeDefault
      position={position}
      fov={35}
      near={0.1}
      far={50}
      onUpdate={(cam) => cam.lookAt(...LOOK_AT)}
    />
  );
};
