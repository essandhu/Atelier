'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { prefsStore } from '@/store/prefs-store';
import { ambientAmplitudeFor } from '@/scene/ambient/damping';

const CUP_POSITION: [number, number, number] = [-0.35, 0.80, -0.05];
const CUP_RADIUS = 0.04;
const CUP_HEIGHT = 0.07;
const CUP_COLOR = '#e9dfcf';

const STEAM_COUNT = 40;
const STEAM_BOUNDS: [number, number, number] = [0.1, 0.3, 0.1];
const STEAM_BASE_VELOCITY = 0.06;

/**
 * Steam uses a per-point opacity buffer attribute rather than a shader
 * injection. The PointsMaterial's `onBeforeCompile` hook isn't needed — a
 * vertex-alpha array baked into the geometry keeps the ramp simple and lets
 * us update per-particle y without re-sorting.
 */
const buildSteamGeometry = (): THREE.BufferGeometry => {
  const positions = new Float32Array(STEAM_COUNT * 3);
  const phases = new Float32Array(STEAM_COUNT);
  const alphas = new Float32Array(STEAM_COUNT);
  for (let i = 0; i < STEAM_COUNT; i++) {
    positions[i * 3 + 0] = (Math.random() - 0.5) * STEAM_BOUNDS[0];
    positions[i * 3 + 1] = Math.random() * STEAM_BOUNDS[1];
    positions[i * 3 + 2] = (Math.random() - 0.5) * STEAM_BOUNDS[2];
    phases[i] = Math.random() * Math.PI * 2;
    alphas[i] = 1;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('phase', new THREE.BufferAttribute(phases, 1));
  geo.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));
  return geo;
};

const buildSteamTexture = (): THREE.Texture => {
  const size = 64;
  const canvas =
    typeof document !== 'undefined'
      ? document.createElement('canvas')
      : (new OffscreenCanvas(size, size) as unknown as HTMLCanvasElement);
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const g = ctx.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2,
    );
    g.addColorStop(0, 'rgba(240, 240, 240, 1)');
    g.addColorStop(0.5, 'rgba(240, 240, 240, 0.4)');
    g.addColorStop(1, 'rgba(240, 240, 240, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  }
  const t = new THREE.CanvasTexture(canvas as HTMLCanvasElement);
  t.needsUpdate = true;
  return t;
};

export const CoffeeCup = (): React.ReactElement => {
  const pointsRef = useRef<THREE.Points>(null);
  const reducedMotionRef = useRef<boolean>(
    prefsStore.getState().reducedMotion,
  );

  useEffect(() => {
    reducedMotionRef.current = prefsStore.getState().reducedMotion;
    return prefsStore.subscribe((s) => {
      reducedMotionRef.current = s.reducedMotion;
    });
  }, []);

  const { geometry, texture } = useMemo(
    () => ({ geometry: buildSteamGeometry(), texture: buildSteamTexture() }),
    [],
  );

  useFrame((_, delta) => {
    const pts = pointsRef.current;
    if (!pts) return;
    const posAttr = pts.geometry.attributes.position as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;
    const velocity = ambientAmplitudeFor(
      reducedMotionRef.current,
      STEAM_BASE_VELOCITY,
    );
    for (let i = 0; i < STEAM_COUNT; i++) {
      const idx = i * 3;
      arr[idx + 1] += velocity * delta;
      if (arr[idx + 1] > STEAM_BOUNDS[1]) {
        arr[idx + 0] = (Math.random() - 0.5) * STEAM_BOUNDS[0];
        arr[idx + 1] = 0;
        arr[idx + 2] = (Math.random() - 0.5) * STEAM_BOUNDS[2];
      }
    }
    posAttr.needsUpdate = true;
  });

  return (
    <group position={CUP_POSITION}>
      {/* Cup body */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[CUP_RADIUS, CUP_RADIUS * 0.85, CUP_HEIGHT, 24]} />
        <meshStandardMaterial color={CUP_COLOR} roughness={0.55} metalness={0.05} />
      </mesh>
      {/* Inner well (dark coffee surface) */}
      <mesh position={[0, CUP_HEIGHT / 2 - 0.005, 0]}>
        <cylinderGeometry args={[CUP_RADIUS * 0.92, CUP_RADIUS * 0.92, 0.005, 24]} />
        <meshStandardMaterial color="#3d2817" roughness={0.3} />
      </mesh>
      {/* Handle (torus slice) — offset so it reads as a D-handle */}
      <mesh
        position={[CUP_RADIUS + 0.01, 0, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        castShadow
      >
        <torusGeometry args={[0.022, 0.006, 12, 12, Math.PI]} />
        <meshStandardMaterial color={CUP_COLOR} roughness={0.55} />
      </mesh>

      {/* Steam — positioned above the cup rim */}
      <points
        ref={pointsRef}
        geometry={geometry}
        position={[0, CUP_HEIGHT / 2 + 0.01, 0]}
        frustumCulled={false}
      >
        <pointsMaterial
          map={texture}
          size={0.035}
          sizeAttenuation
          transparent
          opacity={0.45}
          depthWrite={false}
          color="#f0f0f0"
        />
      </points>
    </group>
  );
};
