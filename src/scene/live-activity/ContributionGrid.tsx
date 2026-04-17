'use client';

import { useMemo, useRef, useState, useLayoutEffect, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import type { ContributionDay } from '@/data/github/types';
import type { TimeOfDayState } from '@/time-of-day/types';
import { presets } from '@/time-of-day/presets';
import {
  cellEmission,
  cellHeight,
  cellMaterialFactory,
  LEVEL_EMISSION_INTENSITY,
} from '@/scene/live-activity/materials';
import { CellTooltip } from '@/scene/live-activity/CellTooltip';

export const GRID_COLS = 13;
export const GRID_ROWS = 7;
export const GRID_CAPACITY = GRID_COLS * GRID_ROWS;
const CELL_SIZE = 0.009;
const CELL_GAP = 0.002;
const PITCH = CELL_SIZE + CELL_GAP;
const BASE_GEOMETRY = new THREE.BoxGeometry(CELL_SIZE, 1, CELL_SIZE);
const TOOLTIP_DELAY_MS = 150;

export interface ContributionGridProps {
  contributions: ContributionDay[];
  state: TimeOfDayState;
}

interface TooltipTarget {
  day: ContributionDay;
  position: THREE.Vector3;
}

const BREATHE_FREQ_HZ = 0.15;
const BREATHE_AMPLITUDE = 0.08;
const BREATHE_WINDOW = 7;

const tmpMatrix = new THREE.Matrix4();
const tmpPosition = new THREE.Vector3();
const tmpQuat = new THREE.Quaternion();
const tmpScale = new THREE.Vector3();
const HIDDEN_SCALE = new THREE.Vector3(0, 0, 0);

const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

export const ContributionGrid = ({
  contributions,
  state,
}: ContributionGridProps): React.ReactElement => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const [tooltip, setTooltip] = useState<TooltipTarget | null>(null);
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const baseColorsRef = useRef<Float32Array | null>(null);
  const reducedMotionRef = useRef<boolean>(prefersReducedMotion());
  const material = useMemo(() => cellMaterialFactory(), []);
  const warmth = presets[state].liveActivityEmissionWarmth;

  const offsetX = ((GRID_COLS - 1) * PITCH) / 2;
  const offsetZ = ((GRID_ROWS - 1) * PITCH) / 2;

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const days = contributions.slice(0, GRID_CAPACITY - 1);

    for (let i = 0; i < GRID_CAPACITY; i++) {
      const day = days[i];
      if (!day || i === GRID_CAPACITY - 1) {
        tmpMatrix.compose(tmpPosition.set(0, 0, 0), tmpQuat, HIDDEN_SCALE);
        mesh.setMatrixAt(i, tmpMatrix);
        continue;
      }
      const col = i % GRID_COLS;
      const row = Math.floor(i / GRID_COLS);
      const h = cellHeight(day.level);
      tmpPosition.set(
        col * PITCH - offsetX,
        h / 2,
        row * PITCH - offsetZ,
      );
      tmpScale.set(1, h, 1);
      tmpMatrix.compose(tmpPosition, tmpQuat, tmpScale);
      mesh.setMatrixAt(i, tmpMatrix);

      const emission = cellEmission(day.level, warmth);
      const scaled = emission
        .clone()
        .multiplyScalar(LEVEL_EMISSION_INTENSITY[day.level]);
      mesh.setColorAt(i, scaled);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
      // Snapshot base colors so the breathe loop can modulate relative to them.
      const src = mesh.instanceColor.array as Float32Array;
      baseColorsRef.current = new Float32Array(src);
    }
  }, [contributions, warmth, offsetX, offsetZ]);

  useFrame(() => {
    const mesh = meshRef.current;
    const base = baseColorsRef.current;
    if (!mesh || !base || !mesh.instanceColor) return;
    if (reducedMotionRef.current) return;
    if (contributions.length < BREATHE_WINDOW) return;

    const t = performance.now() * 0.001;
    const wave =
      1 + BREATHE_AMPLITUDE * Math.sin(t * BREATHE_FREQ_HZ * 2 * Math.PI);

    const startId = Math.min(
      contributions.length,
      GRID_CAPACITY - 1,
    ) - BREATHE_WINDOW;
    const endId = startId + BREATHE_WINDOW;
    const arr = mesh.instanceColor.array as Float32Array;

    for (let i = startId; i < endId; i++) {
      const o = i * 3;
      arr[o] = base[o] * wave;
      arr[o + 1] = base[o + 1] * wave;
      arr[o + 2] = base[o + 2] * wave;
    }
    mesh.instanceColor.needsUpdate = true;
  });

  useEffect(
    () => () => {
      if (showTimerRef.current) clearTimeout(showTimerRef.current);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    },
    [],
  );

  const scheduleShow = (target: TooltipTarget) => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    if (showTimerRef.current) clearTimeout(showTimerRef.current);
    showTimerRef.current = setTimeout(() => {
      setTooltip(target);
    }, TOOLTIP_DELAY_MS);
  };

  const scheduleHide = () => {
    if (showTimerRef.current) {
      clearTimeout(showTimerRef.current);
      showTimerRef.current = null;
    }
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      setTooltip(null);
    }, TOOLTIP_DELAY_MS);
  };

  const handleMove = (e: {
    instanceId?: number;
    point: THREE.Vector3;
    stopPropagation: () => void;
  }) => {
    const id = e.instanceId;
    if (id === undefined || id >= contributions.length) return;
    e.stopPropagation();
    scheduleShow({ day: contributions[id], position: e.point.clone() });
  };

  return (
    <group>
      <Html>
        <div
          data-testid="contribution-grid"
          aria-hidden
          style={{ position: 'absolute', width: 0, height: 0, opacity: 0 }}
        />
      </Html>
      <instancedMesh
        ref={meshRef}
        args={[BASE_GEOMETRY, material, GRID_CAPACITY]}
        onPointerMove={handleMove}
        onPointerOut={scheduleHide}
      />
      {tooltip ? (
        <CellTooltip day={tooltip.day} position={tooltip.position} />
      ) : null}
    </group>
  );
};
