'use client';

import { useLightmap } from '@/scene/lighting/Lightmaps';

const POSITION: [number, number, number] = [0, 0.75, 0];
const SIZE: [number, number, number] = [2, 0.08, 1.2];
const WOOD_COLOR = '#3b2a1f';

export const Desk = (): React.ReactElement => {
  const lightMap = useLightmap();
  return (
    <mesh position={POSITION} castShadow receiveShadow>
      <boxGeometry args={SIZE} />
      <meshStandardMaterial
        color={WOOD_COLOR}
        roughness={0.7}
        metalness={0.05}
        lightMap={lightMap ?? undefined}
        lightMapIntensity={lightMap ? 1 : 0}
      />
    </mesh>
  );
};
