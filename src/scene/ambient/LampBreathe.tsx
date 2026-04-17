'use client';

import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { presets } from '@/time-of-day/presets';
import type { TimeOfDayState } from '@/time-of-day/types';
import { prefsStore } from '@/store/prefs-store';
import { ambientAmplitudeFor } from '@/scene/ambient/damping';

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
  const reducedMotionRef = useRef<boolean>(
    prefsStore.getState().reducedMotion,
  );

  useEffect(() => {
    reducedMotionRef.current = prefsStore.getState().reducedMotion;
    return prefsStore.subscribe((s) => {
      reducedMotionRef.current = s.reducedMotion;
    });
  }, []);

  useFrame(() => {
    const mesh = targetRef.current;
    if (!mesh) return;
    const material = mesh.material as THREE.MeshStandardMaterial | undefined;
    if (!material || !('emissiveIntensity' in material)) return;
    const amplitude = ambientAmplitudeFor(
      reducedMotionRef.current,
      base * AMPLITUDE_RATIO,
    );
    const t = performance.now() * 0.001;
    const offset = Math.sin(t * FREQUENCY_HZ * Math.PI * 2) * amplitude;
    material.emissiveIntensity = base + offset;
  });
  return null;
};
