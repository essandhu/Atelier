'use client';

import { useMemo } from 'react';

const PLANT_POSITION: [number, number, number] = [-0.7, 0.80, -0.30];
const POT_COLOR = '#b76f4a';
const LEAF_COLOR = '#3e5f3a';
const POT_HEIGHT = 0.06;
const POT_RADIUS = 0.045;
const LEAF_COUNT = 7;

interface LeafProps {
  position: [number, number, number];
  rotation: [number, number, number];
}

const Leaves = (): React.ReactElement => {
  // Precompute leaf transforms once so the cones don't re-jitter on re-render.
  const leaves = useMemo<LeafProps[]>(() => {
    const out: LeafProps[] = [];
    for (let i = 0; i < LEAF_COUNT; i++) {
      const t = i / LEAF_COUNT;
      const theta = t * Math.PI * 2;
      const tilt = 0.25 + Math.random() * 0.3;
      out.push({
        position: [
          Math.cos(theta) * 0.018,
          POT_HEIGHT / 2 + 0.04,
          Math.sin(theta) * 0.018,
        ],
        rotation: [tilt, theta, 0],
      });
    }
    return out;
  }, []);
  return (
    <group>
      {leaves.map((leaf, i) => (
        <mesh
          key={i}
          position={leaf.position}
          rotation={leaf.rotation}
          castShadow
        >
          <coneGeometry args={[0.012, 0.08, 8]} />
          <meshStandardMaterial color={LEAF_COLOR} roughness={0.85} />
        </mesh>
      ))}
    </group>
  );
};

export const Plant = (): React.ReactElement => {
  return (
    <group position={PLANT_POSITION}>
      <mesh castShadow receiveShadow>
        <cylinderGeometry
          args={[POT_RADIUS, POT_RADIUS * 0.82, POT_HEIGHT, 20]}
        />
        <meshStandardMaterial
          color={POT_COLOR}
          roughness={0.8}
          metalness={0.02}
        />
      </mesh>
      {/* Soil layer */}
      <mesh position={[0, POT_HEIGHT / 2 - 0.003, 0]}>
        <cylinderGeometry
          args={[POT_RADIUS * 0.95, POT_RADIUS * 0.95, 0.005, 20]}
        />
        <meshStandardMaterial color="#2a1d13" roughness={0.95} />
      </mesh>
      <Leaves />
    </group>
  );
};
