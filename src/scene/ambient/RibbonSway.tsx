'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { prefsStore } from '@/store/prefs-store';
import { ambientAmplitudeFor } from '@/scene/ambient/damping';
import { getAccent } from '@/ui/controls/accent';

// Spine y-coordinate matches the desk-centre hero book (HERO_BOOK_POSITION
// y=0.79, cover top at ~0.796). Hardcoded here rather than imported to avoid
// a cross-module dependency on the hero-book bundle — if the book moves,
// update the two constants together (see src/scene/hero-book/positions.ts).
const RIBBON_ANCHOR: [number, number, number] = [-0.05, 0.796, 0.12];
const RIBBON_LENGTH = 0.18;
const RIBBON_WIDTH = 0.012;
const SEGMENTS = 12;

const buildRibbonGeometry = (): THREE.PlaneGeometry => {
  const geo = new THREE.PlaneGeometry(
    RIBBON_WIDTH,
    RIBBON_LENGTH,
    1,
    SEGMENTS,
  );
  return geo;
};

export const RibbonSway = (): React.ReactElement => {
  const meshRef = useRef<THREE.Mesh>(null);
  const reducedMotionRef = useRef<boolean>(
    prefsStore.getState().reducedMotion,
  );
  const geometry = useMemo(() => buildRibbonGeometry(), []);
  const basePositions = useMemo(() => {
    const attr = geometry.attributes.position as THREE.BufferAttribute;
    return new Float32Array(attr.array);
  }, [geometry]);
  const accent = useMemo(() => getAccent(), []);

  useEffect(() => {
    reducedMotionRef.current = prefsStore.getState().reducedMotion;
    return prefsStore.subscribe((s) => {
      reducedMotionRef.current = s.reducedMotion;
    });
  }, []);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const attr = mesh.geometry.attributes.position as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    const t = performance.now() * 0.001;
    const amp = ambientAmplitudeFor(reducedMotionRef.current, 0.008);
    for (let i = 0; i < arr.length; i += 3) {
      const baseX = basePositions[i];
      const baseY = basePositions[i + 1];
      // Displace lower half more than upper (anchored to spine at top)
      const anchorFactor = Math.max(0, (RIBBON_LENGTH / 2 - baseY) / RIBBON_LENGTH);
      const offset = Math.sin(t * 0.8 + baseX * 30) * amp * anchorFactor;
      arr[i + 2] = offset;
    }
    attr.needsUpdate = true;
  });

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      // Hang the ribbon below the spine anchor: the plane's local +Y is up,
      // and we want the anchored top to meet the book spine.
      position={[
        RIBBON_ANCHOR[0],
        RIBBON_ANCHOR[1] - RIBBON_LENGTH / 2,
        RIBBON_ANCHOR[2],
      ]}
    >
      <meshStandardMaterial
        color={accent}
        roughness={0.55}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};
