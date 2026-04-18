'use client';

/**
 * Exterior-hint mix (per-state "something is out there" cue):
 *   exterior = windowColor.clone().lerp(SKY_HINT[state], 0.55)
 * — takes each preset's windowColor toward a per-state sky/darkness hue so
 * morning reads cool-pale, day reads bright-neutral, evening reads warm,
 * night reads deep blue-black. The plane sits slightly behind the pane in
 * the window group's local space.
 */

import * as THREE from 'three';
import { useMemo } from 'react';
import { presets } from '@/time-of-day/presets';
import type { TimeOfDayState } from '@/time-of-day/types';

const POSITION: [number, number, number] = [-1.2, 1.2, -0.8];
const ROTATION: [number, number, number] = [0, Math.PI / 12, 0];
const PANE_SIZE: [number, number] = [1.0, 1.5];
const FRAME_COLOR = '#2a1810';
const FRAME_THICKNESS = 0.04;
const MUNTIN_THICKNESS = 0.02;
const FRAME_DEPTH = 0.05;
const SILL_HEIGHT = 0.06;
const SILL_DEPTH = 0.12;
const SILL_OVERHANG = 0.25;

const SKY_HINT: Record<TimeOfDayState, THREE.Color> = {
  morning: new THREE.Color('#a4b8d8'),
  day: new THREE.Color('#d6e0ec'),
  evening: new THREE.Color('#caa070'),
  night: new THREE.Color('#0a0d18'),
};

export interface WindowProps {
  state: TimeOfDayState;
}

export const Window = ({ state }: WindowProps): React.ReactElement => {
  const { windowColor, windowIntensity } = presets[state];
  const [paneW, paneH] = PANE_SIZE;
  const halfW = paneW / 2;
  const halfH = paneH / 2;

  const exteriorColor = useMemo(
    () => windowColor.clone().lerp(SKY_HINT[state], 0.55),
    [windowColor, state],
  );

  const sillWidth = paneW + SILL_OVERHANG * 2;
  const sillY = -halfH - FRAME_THICKNESS - SILL_HEIGHT / 2;

  return (
    <group position={POSITION} rotation={ROTATION}>
      {/* Exterior-hint plane — sits slightly behind pane, size ~1.2× pane. */}
      <mesh position={[0, 0, -0.02]}>
        <planeGeometry args={[paneW * 1.2, paneH * 1.2]} />
        <meshBasicMaterial color={exteriorColor} toneMapped={false} />
      </mesh>

      {/* Emissive pane. */}
      <mesh>
        <planeGeometry args={[paneW, paneH]} />
        <meshStandardMaterial
          emissive={windowColor}
          emissiveIntensity={windowIntensity}
          color="#000000"
          toneMapped={false}
          transparent
          opacity={0.92}
        />
      </mesh>

      {/* Muntins: one horizontal, one vertical, splitting pane into 2×2 grid. */}
      <mesh position={[0, 0, 0.005]}>
        <boxGeometry args={[paneW, MUNTIN_THICKNESS, FRAME_DEPTH]} />
        <meshStandardMaterial color={FRAME_COLOR} roughness={0.8} />
      </mesh>
      <mesh position={[0, 0, 0.005]}>
        <boxGeometry args={[MUNTIN_THICKNESS, paneH, FRAME_DEPTH]} />
        <meshStandardMaterial color={FRAME_COLOR} roughness={0.8} />
      </mesh>

      {/* Frame bars (4). */}
      <mesh position={[0, halfH + FRAME_THICKNESS / 2, 0]} castShadow>
        <boxGeometry
          args={[paneW + FRAME_THICKNESS * 2, FRAME_THICKNESS, FRAME_DEPTH]}
        />
        <meshStandardMaterial color={FRAME_COLOR} roughness={0.8} />
      </mesh>
      <mesh position={[0, -halfH - FRAME_THICKNESS / 2, 0]} castShadow>
        <boxGeometry
          args={[paneW + FRAME_THICKNESS * 2, FRAME_THICKNESS, FRAME_DEPTH]}
        />
        <meshStandardMaterial color={FRAME_COLOR} roughness={0.8} />
      </mesh>
      <mesh position={[-halfW - FRAME_THICKNESS / 2, 0, 0]} castShadow>
        <boxGeometry args={[FRAME_THICKNESS, paneH, FRAME_DEPTH]} />
        <meshStandardMaterial color={FRAME_COLOR} roughness={0.8} />
      </mesh>
      <mesh position={[halfW + FRAME_THICKNESS / 2, 0, 0]} castShadow>
        <boxGeometry args={[FRAME_THICKNESS, paneH, FRAME_DEPTH]} />
        <meshStandardMaterial color={FRAME_COLOR} roughness={0.8} />
      </mesh>

      {/* Sill — thicker slab under the bottom frame, projects forward. */}
      <mesh position={[0, sillY, SILL_DEPTH / 2 - FRAME_DEPTH / 2]} castShadow>
        <boxGeometry args={[sillWidth, SILL_HEIGHT, SILL_DEPTH]} />
        <meshStandardMaterial color={FRAME_COLOR} roughness={0.8} />
      </mesh>
    </group>
  );
};
