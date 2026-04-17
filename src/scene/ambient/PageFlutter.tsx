'use client';

import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type * as THREE from 'three';
import { prefsStore } from '@/store/prefs-store';
import { ambientAmplitudeFor } from '@/scene/ambient/damping';

const FLUTTER_FREQ_HZ = 0.1;
const FLUTTER_AMPLITUDE = 0.0004; // 0.4mm peak, imperceptible close-up.

interface PageFlutterProps {
  targetRef?: React.RefObject<THREE.Mesh | null>;
}

export const PageFlutter = ({
  targetRef,
}: PageFlutterProps): React.ReactElement | null => {
  const baseYRef = useRef<Float32Array | null>(null);
  const reducedMotionRef = useRef<boolean>(
    prefsStore.getState().reducedMotion,
  );

  useEffect(() => {
    reducedMotionRef.current = prefsStore.getState().reducedMotion;
    return prefsStore.subscribe((s) => {
      reducedMotionRef.current = s.reducedMotion;
    });
  }, []);

  useEffect(() => {
    const mesh = targetRef?.current;
    if (!mesh) return;
    const positions = mesh.geometry.attributes.position as
      | THREE.BufferAttribute
      | undefined;
    if (!positions) return;
    // Cache base Y so the flutter modulates relative to the rest state.
    const array = positions.array as Float32Array;
    const ys = new Float32Array(array.length / 3);
    for (let i = 0; i < ys.length; i++) ys[i] = array[i * 3 + 1];
    baseYRef.current = ys;
  }, [targetRef]);

  useFrame(() => {
    const mesh = targetRef?.current;
    const base = baseYRef.current;
    if (!mesh || !base) return;
    const amplitude = ambientAmplitudeFor(
      reducedMotionRef.current,
      FLUTTER_AMPLITUDE,
    );
    if (amplitude === 0) return;
    const positions = mesh.geometry.attributes.position as
      | THREE.BufferAttribute
      | undefined;
    if (!positions) return;

    const array = positions.array as Float32Array;
    const t = performance.now() * 0.001;
    const phase = t * FLUTTER_FREQ_HZ * 2 * Math.PI;

    for (let v = 0; v < base.length; v++) {
      const px = array[v * 3];
      const pz = array[v * 3 + 2];
      const vertexPhase = px * 6.2 + pz * 3.1;
      array[v * 3 + 1] = base[v] + amplitude * Math.sin(phase + vertexPhase);
    }
    positions.needsUpdate = true;
  });

  if (!targetRef?.current) return null;
  return null;
};
