'use client';

import { useMemo } from 'react';
import { PLANT_POSITION } from '@/scene/ambient/positions';

/**
 * Floor-standing plant placeholder for the white-flowering oleander commissioned
 * in brief §5.5. Geometry intentionally reads as a Stage-A blockout — the artist
 * replaces the whole asset; only the silhouette (terracotta pot, vertical
 * foliage mass to ~0.55 m, sprigs of white bloom) needs to land at roughly the
 * right scale and composition weight.
 */

const POT_COLOR = '#8a4f30';
const SOIL_COLOR = '#2a1d13';
const FOLIAGE_COLOR = '#3e5f3a';
const BLOOM_COLOR = '#f4ebe1';

const POT_RADIUS_TOP = 0.16;
const POT_RADIUS_BOTTOM = 0.13;
const POT_HEIGHT = 0.20;
const TRUNK_HEIGHT = 0.18;
const LEAF_COUNT = 18;
const BLOOM_COUNT = 4;

interface LeafProps {
  position: [number, number, number];
  rotation: [number, number, number];
  length: number;
}

interface BloomProps {
  position: [number, number, number];
}

export const Plant = (): React.ReactElement => {
  // Pre-compute the foliage cluster and bloom positions once. Deterministic
  // pseudo-random based on index so the silhouette stays stable across renders
  // — Math.random() was fine for the desk succulent but the bigger volume
  // makes any frame-to-frame jitter visible.
  const { leaves, blooms } = useMemo(() => {
    const leaves: LeafProps[] = [];
    for (let i = 0; i < LEAF_COUNT; i++) {
      const t = i / LEAF_COUNT;
      const ring = Math.floor(i / 6);
      const theta = t * Math.PI * 2 * 3;
      const radius = 0.03 + ring * 0.025;
      const yBase = POT_HEIGHT / 2 + TRUNK_HEIGHT + ring * 0.06;
      const tilt = 0.15 + (i % 5) * 0.07;
      const length = 0.16 + (i % 4) * 0.02;
      leaves.push({
        position: [
          Math.cos(theta) * radius,
          yBase,
          Math.sin(theta) * radius,
        ],
        rotation: [tilt, theta, 0],
        length,
      });
    }
    const blooms: BloomProps[] = [];
    for (let i = 0; i < BLOOM_COUNT; i++) {
      const theta = (i / BLOOM_COUNT) * Math.PI * 2 + 0.4;
      const radius = 0.05 + (i % 2) * 0.02;
      const y = POT_HEIGHT / 2 + TRUNK_HEIGHT + 0.18 + (i % 2) * 0.04;
      blooms.push({
        position: [Math.cos(theta) * radius, y, Math.sin(theta) * radius],
      });
    }
    return { leaves, blooms };
  }, []);

  return (
    <group position={PLANT_POSITION}>
      {/* Terracotta pot — slight inward taper to read as a thrown vessel. */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry
          args={[POT_RADIUS_TOP, POT_RADIUS_BOTTOM, POT_HEIGHT, 18]}
        />
        <meshStandardMaterial
          color={POT_COLOR}
          roughness={0.85}
          metalness={0.02}
        />
      </mesh>

      {/* Soil layer just below pot rim. */}
      <mesh position={[0, POT_HEIGHT / 2 - 0.006, 0]}>
        <cylinderGeometry
          args={[POT_RADIUS_TOP * 0.93, POT_RADIUS_TOP * 0.93, 0.006, 18]}
        />
        <meshStandardMaterial color={SOIL_COLOR} roughness={0.95} />
      </mesh>

      {/* Trunk stub rising from the soil — the foliage cones cluster around
          and above it so the silhouette doesn't read as a bare cylinder. */}
      <mesh
        position={[0, POT_HEIGHT / 2 + TRUNK_HEIGHT / 2, 0]}
        castShadow
      >
        <cylinderGeometry args={[0.012, 0.018, TRUNK_HEIGHT, 8]} />
        <meshStandardMaterial color="#3a2818" roughness={0.9} />
      </mesh>

      {/* Foliage cluster — lanceolate leaves approximated as elongated cones,
          tilted outward in three rising rings to suggest oleander's upright
          habit. */}
      <group>
        {leaves.map((leaf, i) => (
          <mesh
            key={i}
            position={leaf.position}
            rotation={leaf.rotation}
            castShadow
          >
            <coneGeometry args={[0.015, leaf.length, 8]} />
            <meshStandardMaterial color={FOLIAGE_COLOR} roughness={0.85} />
          </mesh>
        ))}
      </group>

      {/* White bloom clusters at the upper foliage tips. Small low-poly
          spheres are placeholders for the artist's bloom geometry. */}
      <group>
        {blooms.map((bloom, i) => (
          <mesh key={i} position={bloom.position} castShadow>
            <sphereGeometry args={[0.028, 10, 8]} />
            <meshStandardMaterial color={BLOOM_COLOR} roughness={0.75} />
          </mesh>
        ))}
      </group>
    </group>
  );
};
