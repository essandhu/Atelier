'use client';

import { forwardRef, useMemo } from 'react';
import * as THREE from 'three';
import { presets } from '@/time-of-day/presets';
import { getAccent } from '@/ui/controls/accent';

export const LAMP_BULB_POSITION: [number, number, number] = [0.5, 1.3, 0.3];

const BASE_POSITION: [number, number, number] = [0.5, 0.79, 0.15];
const BODY_COLOR = '#4a3a2a';

export const Lamp = forwardRef<THREE.Mesh>((_, bulbRef) => {
  const accent = useMemo(() => getAccent(), []);
  const evening = presets.evening;
  const emissiveIntensity = evening.lampEmissionStrength;

  return (
    <group position={BASE_POSITION}>
      <mesh position={[0, 0.01, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.12, 0.14, 0.02, 24]} />
        <meshStandardMaterial color={BODY_COLOR} roughness={0.55} metalness={0.35} />
      </mesh>

      <mesh position={[0, 0.22, 0]} castShadow>
        <cylinderGeometry args={[0.012, 0.012, 0.42, 16]} />
        <meshStandardMaterial color={BODY_COLOR} roughness={0.5} metalness={0.4} />
      </mesh>

      <mesh position={[0, 0.5, 0]} castShadow>
        <coneGeometry args={[0.18, 0.22, 24, 1, true]} />
        <meshStandardMaterial
          color={BODY_COLOR}
          side={THREE.DoubleSide}
          roughness={0.6}
          metalness={0.3}
        />
      </mesh>

      <mesh
        ref={bulbRef}
        position={[
          LAMP_BULB_POSITION[0] - BASE_POSITION[0],
          LAMP_BULB_POSITION[1] - BASE_POSITION[1],
          LAMP_BULB_POSITION[2] - BASE_POSITION[2],
        ]}
      >
        <sphereGeometry args={[0.05, 24, 24]} />
        <meshStandardMaterial
          color="#fff5e0"
          emissive={accent}
          emissiveIntensity={emissiveIntensity}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
});

Lamp.displayName = 'Lamp';
