'use client';

import { presets } from '@/time-of-day/presets';

const POSITION: [number, number, number] = [-1.2, 1.2, -0.8];
const ROTATION: [number, number, number] = [0, Math.PI / 12, 0];
const PANE_SIZE: [number, number] = [1.0, 1.5];
const FRAME_COLOR = '#2a1810';
const FRAME_THICKNESS = 0.04;

export const Window = (): React.ReactElement => {
  const { windowColor, windowIntensity } = presets.evening;
  const [paneW, paneH] = PANE_SIZE;
  const halfW = paneW / 2;
  const halfH = paneH / 2;
  const frameDepth = 0.05;

  return (
    <group position={POSITION} rotation={ROTATION}>
      <mesh>
        <planeGeometry args={[paneW, paneH]} />
        <meshStandardMaterial
          emissive={windowColor}
          emissiveIntensity={windowIntensity}
          color="#000000"
          toneMapped={false}
        />
      </mesh>

      <mesh position={[0, halfH + FRAME_THICKNESS / 2, 0]} castShadow>
        <boxGeometry
          args={[paneW + FRAME_THICKNESS * 2, FRAME_THICKNESS, frameDepth]}
        />
        <meshStandardMaterial color={FRAME_COLOR} roughness={0.8} />
      </mesh>
      <mesh position={[0, -halfH - FRAME_THICKNESS / 2, 0]} castShadow>
        <boxGeometry
          args={[paneW + FRAME_THICKNESS * 2, FRAME_THICKNESS, frameDepth]}
        />
        <meshStandardMaterial color={FRAME_COLOR} roughness={0.8} />
      </mesh>
      <mesh position={[-halfW - FRAME_THICKNESS / 2, 0, 0]} castShadow>
        <boxGeometry args={[FRAME_THICKNESS, paneH, frameDepth]} />
        <meshStandardMaterial color={FRAME_COLOR} roughness={0.8} />
      </mesh>
      <mesh position={[halfW + FRAME_THICKNESS / 2, 0, 0]} castShadow>
        <boxGeometry args={[FRAME_THICKNESS, paneH, frameDepth]} />
        <meshStandardMaterial color={FRAME_COLOR} roughness={0.8} />
      </mesh>
    </group>
  );
};
