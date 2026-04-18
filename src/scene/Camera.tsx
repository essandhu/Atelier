'use client';

import { useRef } from 'react';
import { PerspectiveCamera } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useIsNarrowViewport } from '@/lib/use-narrow-viewport';
import { parallaxStore } from '@/store/parallax-store';

interface CameraProps {
  parallaxOffset?: THREE.Vector3;
}

const BASE_POSITION: [number, number, number] = [0, 1.5, 2.2];
const LOOK_AT: [number, number, number] = [0, 0.9, 0];
const NARROW_Z_SCALE = 0.88; // pulls ~12% closer
const BASE_FOV = 35;
const NARROW_FOV = 39; // +4° on narrow viewports
const OFFSET_LERP = 0.18; // per-frame low-pass; hides source jitter at 60 fps

const _lookAtTarget = new THREE.Vector3(LOOK_AT[0], LOOK_AT[1], LOOK_AT[2]);

export const Camera = ({ parallaxOffset }: CameraProps): React.ReactElement => {
  const narrow = useIsNarrowViewport();
  const basePosition: [number, number, number] = narrow
    ? [BASE_POSITION[0], BASE_POSITION[1], BASE_POSITION[2] * NARROW_Z_SCALE]
    : BASE_POSITION;
  // Prop wins when supplied (test-drive / legacy); otherwise store feeds the
  // per-frame useFrame loop. Mutually exclusive by construction.
  const staticPosition: [number, number, number] | undefined = parallaxOffset
    ? [
        basePosition[0] + parallaxOffset.x,
        basePosition[1] + parallaxOffset.y,
        basePosition[2] + parallaxOffset.z,
      ]
    : undefined;

  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const appliedOffset = useRef({ x: 0, y: 0, z: 0 });

  useFrame(() => {
    if (parallaxOffset) return; // prop mode — no live subscription
    const cam = cameraRef.current;
    if (!cam) return;
    const target = parallaxStore.getState().offset;
    appliedOffset.current.x +=
      (target.x - appliedOffset.current.x) * OFFSET_LERP;
    appliedOffset.current.y +=
      (target.y - appliedOffset.current.y) * OFFSET_LERP;
    appliedOffset.current.z +=
      (target.z - appliedOffset.current.z) * OFFSET_LERP;
    cam.position.set(
      basePosition[0] + appliedOffset.current.x,
      basePosition[1] + appliedOffset.current.y,
      basePosition[2] + appliedOffset.current.z,
    );
    cam.lookAt(_lookAtTarget);
  });

  return (
    <PerspectiveCamera
      ref={cameraRef}
      makeDefault
      position={staticPosition ?? basePosition}
      fov={narrow ? NARROW_FOV : BASE_FOV}
      near={0.1}
      far={50}
      onUpdate={(cam) => cam.lookAt(..._lookAtTarget.toArray())}
    />
  );
};
