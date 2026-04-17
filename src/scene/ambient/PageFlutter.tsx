'use client';

import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type * as THREE from 'three';

const FLUTTER_FREQ_HZ = 0.1;
const FLUTTER_AMPLITUDE = 0.0004; // 0.4mm peak, imperceptible close-up.

interface PageFlutterProps {
  targetRef?: React.RefObject<THREE.Mesh | null>;
}

const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

export const PageFlutter = ({
  targetRef,
}: PageFlutterProps): React.ReactElement | null => {
  const baseYRef = useRef<Float32Array | null>(null);
  const reducedMotionRef = useRef<boolean>(prefersReducedMotion());

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
    if (reducedMotionRef.current) return;
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
      array[v * 3 + 1] =
        base[v] + FLUTTER_AMPLITUDE * Math.sin(phase + vertexPhase);
    }
    positions.needsUpdate = true;
  });

  if (!targetRef?.current) return null;
  return null;
};
