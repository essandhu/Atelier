'use client';

import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { presets } from '@/time-of-day/presets';
import type { TimeOfDayState } from '@/time-of-day/types';

interface LampBreatheProps {
  targetRef: React.RefObject<THREE.Mesh | null>;
  state: TimeOfDayState;
}

const FREQUENCY_HZ = 0.25;
const AMPLITUDE_RATIO = 0.05;

export const LampBreathe = ({
  targetRef,
  state,
}: LampBreatheProps): null => {
  const base = presets[state].lampEmissionStrength;
  useFrame(() => {
    const mesh = targetRef.current;
    if (!mesh) return;
    const material = mesh.material as THREE.MeshStandardMaterial | undefined;
    if (!material || !('emissiveIntensity' in material)) return;
    const t = performance.now() * 0.001;
    const offset =
      Math.sin(t * FREQUENCY_HZ * Math.PI * 2) * (base * AMPLITUDE_RATIO);
    material.emissiveIntensity = base + offset;
  });
  return null;
};
