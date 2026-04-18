'use client';

import {
  WALL_PIECE_POSITION,
  WALL_PIECE_SIZE,
} from '@/scene/background/positions';

const FRAME_COLOR = '#2a1810';
const FRAME_PADDING = 0.04;
const FRAME_DEPTH = 0.03;
const CANVAS_COLOR = '#6a6257';
const CANVAS_FORWARD_OFFSET = 0.015;

export const WallPiece = (): React.ReactElement => {
  const [w, h] = WALL_PIECE_SIZE;

  return (
    <group position={WALL_PIECE_POSITION}>
      <mesh>
        <boxGeometry
          args={[w + FRAME_PADDING, h + FRAME_PADDING, FRAME_DEPTH]}
        />
        <meshStandardMaterial color={FRAME_COLOR} roughness={0.8} />
      </mesh>
      <mesh position={[0, 0, FRAME_DEPTH / 2 + CANVAS_FORWARD_OFFSET]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial color={CANVAS_COLOR} roughness={0.9} />
      </mesh>
    </group>
  );
};
