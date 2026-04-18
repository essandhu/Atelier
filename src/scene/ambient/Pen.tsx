'use client';

const PEN_POSITION: [number, number, number] = [0.12, 0.793, 0.18];
const PEN_LENGTH = 0.12;
const PEN_RADIUS = 0.004;
const BODY_COLOR = '#121212';

export const Pen = (): React.ReactElement => {
  return (
    <group position={PEN_POSITION} rotation={[0, (25 * Math.PI) / 180, 0]}>
      {/* Body — laid along local X, perpendicular to the desk edge */}
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
        <cylinderGeometry args={[PEN_RADIUS, PEN_RADIUS, PEN_LENGTH, 16]} />
        <meshStandardMaterial
          color={BODY_COLOR}
          roughness={0.35}
          metalness={0.2}
        />
      </mesh>
      {/* Tip (conical) at +X end */}
      <mesh
        position={[PEN_LENGTH / 2 + 0.005, 0, 0]}
        rotation={[0, 0, -Math.PI / 2]}
        castShadow
      >
        <coneGeometry args={[PEN_RADIUS * 0.95, 0.012, 12]} />
        <meshStandardMaterial
          color="#c7c2b8"
          roughness={0.25}
          metalness={0.6}
        />
      </mesh>
      {/* Clip on top */}
      <mesh
        position={[-PEN_LENGTH / 2 + 0.02, PEN_RADIUS + 0.002, 0]}
        castShadow
      >
        <boxGeometry args={[0.025, 0.002, 0.003]} />
        <meshStandardMaterial
          color="#c7c2b8"
          roughness={0.25}
          metalness={0.6}
        />
      </mesh>
    </group>
  );
};
