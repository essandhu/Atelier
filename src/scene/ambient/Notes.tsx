'use client';

import { useMemo } from 'react';
import * as THREE from 'three';

const NOTES_POSITION: [number, number, number] = [0.25, 0.792, 0.22];
const NOTES_SIZE: [number, number, number] = [0.15, 0.002, 0.22];
const NOTES_ROTATION_Y = (-15 * Math.PI) / 180;

/**
 * Cheap procedural noise written to a small canvas. Resembles fiber in
 * paper without shipping a texture asset — keeps Phase 6 on the
 * primitives-only contract (`.ktx2` assets land in Phase 10).
 */
const buildPaperTexture = (): THREE.Texture => {
  const size = 128;
  const canvas =
    typeof document !== 'undefined'
      ? document.createElement('canvas')
      : (new OffscreenCanvas(size, size) as unknown as HTMLCanvasElement);
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Base off-white
    ctx.fillStyle = '#f2ead8';
    ctx.fillRect(0, 0, size, size);
    // Speckle — low-contrast fiber flecks
    const image = ctx.getImageData(0, 0, size, size);
    const data = image.data;
    for (let i = 0; i < data.length; i += 4) {
      const n = (Math.random() - 0.5) * 20;
      data[i + 0] = Math.max(0, Math.min(255, data[i + 0] + n));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + n));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + n));
    }
    ctx.putImageData(image, 0, 0);
  }
  const t = new THREE.CanvasTexture(canvas as HTMLCanvasElement);
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.needsUpdate = true;
  return t;
};

export const Notes = (): React.ReactElement => {
  const texture = useMemo(() => buildPaperTexture(), []);
  return (
    <mesh
      position={NOTES_POSITION}
      rotation={[0, NOTES_ROTATION_Y, 0]}
      castShadow
      receiveShadow
    >
      <boxGeometry args={NOTES_SIZE} />
      <meshStandardMaterial map={texture} roughness={0.95} color="#f2ead8" />
    </mesh>
  );
};
