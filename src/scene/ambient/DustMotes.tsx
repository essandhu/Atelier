'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { presets } from '@/time-of-day/presets';
import type { TimeOfDayState } from '@/time-of-day/types';

interface DustMotesProps {
  state: TimeOfDayState;
}

const COUNT = 200;
const VOLUME: [number, number, number] = [3, 2, 2];
const Y_TOP = 2.4;
const Y_BOTTOM = 0.4;
const VELOCITY = 0.018;

const buildSpriteTexture = (): THREE.Texture => {
  const size = 64;
  const canvas =
    typeof document !== 'undefined'
      ? document.createElement('canvas')
      : (new OffscreenCanvas(size, size) as unknown as HTMLCanvasElement);
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const gradient = ctx.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2,
    );
    gradient.addColorStop(0, 'rgba(255, 230, 200, 1)');
    gradient.addColorStop(0.4, 'rgba(255, 220, 180, 0.6)');
    gradient.addColorStop(1, 'rgba(255, 200, 160, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }
  const texture = new THREE.CanvasTexture(canvas as HTMLCanvasElement);
  texture.needsUpdate = true;
  return texture;
};

export const DustMotes = ({ state }: DustMotesProps): React.ReactElement => {
  const opacity = presets[state].dustMoteOpacity;
  const ref = useRef<THREE.Points>(null);

  const { geometry, sprite, phases } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const phaseArr = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * VOLUME[0];
      positions[i * 3 + 1] = Y_BOTTOM + Math.random() * (Y_TOP - Y_BOTTOM);
      positions[i * 3 + 2] = (Math.random() - 0.5) * VOLUME[2];
      phaseArr[i] = Math.random() * Math.PI * 2;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return { geometry: geo, sprite: buildSpriteTexture(), phases: phaseArr };
  }, []);

  useFrame((_, delta) => {
    const points = ref.current;
    if (!points) return;
    const attr = points.geometry.attributes.position as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    const t = performance.now() * 0.001;
    for (let i = 0; i < COUNT; i++) {
      const idx = i * 3;
      arr[idx + 1] += VELOCITY * delta;
      arr[idx + 0] += Math.sin(t + phases[i]) * 0.0002;
      if (arr[idx + 1] > Y_TOP) {
        arr[idx + 1] = Y_BOTTOM;
        arr[idx + 0] = (Math.random() - 0.5) * VOLUME[0];
        arr[idx + 2] = (Math.random() - 0.5) * VOLUME[2];
      }
    }
    attr.needsUpdate = true;
  });

  return (
    <points ref={ref} geometry={geometry} frustumCulled={false}>
      <pointsMaterial
        map={sprite}
        size={0.025}
        sizeAttenuation
        transparent
        opacity={opacity}
        depthWrite={false}
        color="#ffd9a8"
      />
    </points>
  );
};
