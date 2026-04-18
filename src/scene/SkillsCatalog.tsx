'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { sceneStore } from '@/store/scene-store';
import { TAB_ORDER } from '@/interaction/tab-order';
import {
  SKILLS_CATALOG_POSITION,
  SKILLS_CATALOG_SIZE,
} from '@/scene/skills/positions';
import { getAccent } from '@/ui/controls/accent';

const BOX_COLOR = '#6b4a2a';
const CARD_COLOR = '#efe5cf';
const HOVER_LIFT = 0.001;
const HOVER_GLOW = 0.1;
const CARD_ROWS = 4;

export const SkillsCatalog = (): React.ReactElement => {
  const groupRef = useRef<THREE.Group>(null);
  const cardMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const hoverRef = useRef(0);
  const [w, h, d] = SKILLS_CATALOG_SIZE;
  const accent = getAccent();

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;
    group.position.y = SKILLS_CATALOG_POSITION[1] + HOVER_LIFT * hoverRef.current;
    const mat = cardMatRef.current;
    if (mat) {
      mat.emissiveIntensity = HOVER_GLOW * hoverRef.current;
    }
  });

  const onPointerOver = (): void => {
    hoverRef.current = 1;
    sceneStore.getState().setHovered('skills-catalog');
  };

  const onPointerOut = (): void => {
    hoverRef.current = 0;
    sceneStore.getState().setHovered(null);
  };

  const onClick = (event: { stopPropagation: () => void }): void => {
    event.stopPropagation();
    sceneStore.getState().open({ kind: 'skills' });
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    sceneStore.getState().open({ kind: 'skills' });
  };

  const rowSpacing = h / (CARD_ROWS + 1);
  const cardHeight = rowSpacing * 0.7;
  const cardWidth = w * 0.82;
  const cardDepth = 0.001;

  return (
    <group ref={groupRef} position={SKILLS_CATALOG_POSITION}>
      <group
        onPointerOver={onPointerOver}
        onPointerOut={onPointerOut}
        onClick={onClick}
      >
        {/* Wooden drawer housing */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial
            color={BOX_COLOR}
            roughness={0.75}
            metalness={0.05}
          />
        </mesh>

        {/* Card faces, inset into the +Z face of the drawer */}
        {Array.from({ length: CARD_ROWS }).map((_, i) => {
          const y = h / 2 - rowSpacing * (i + 1);
          return (
            <mesh
              key={i}
              position={[0, y, d / 2 + 0.0005]}
              receiveShadow
            >
              <boxGeometry args={[cardWidth, cardHeight, cardDepth]} />
              <meshStandardMaterial
                ref={i === 0 ? cardMatRef : undefined}
                color={CARD_COLOR}
                roughness={0.9}
                emissive={accent}
                emissiveIntensity={0}
              />
            </mesh>
          );
        })}
      </group>

      <Html center>
        <div
          tabIndex={TAB_ORDER.skillsCatalog}
          role="button"
          aria-haspopup="dialog"
          aria-label="Skills catalog — press Enter to open"
          data-testid="skills-catalog-hotspot"
          onKeyDown={onKeyDown}
          style={{ width: 0, height: 0, opacity: 0 }}
        />
      </Html>
    </group>
  );
};
