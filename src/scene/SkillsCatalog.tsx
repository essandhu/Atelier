'use client';

import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { sceneStore, useSceneStore } from '@/store/scene-store';
import { usePrefsStore } from '@/store/prefs-store';
import { TAB_ORDER } from '@/interaction/tab-order';
import { useDockDriver } from '@/interaction/camera-dock/driver';
import { POSES } from '@/interaction/camera-dock/poses';
import { useDiegeticPresentation } from '@/interaction/camera-dock/presentation';
import { useDockPhaseTimers } from '@/interaction/camera-dock/phase-timers';
import { SkillsCatalogPanel } from '@/ui/panels/SkillsCatalogPanel';
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
  // Outer group — driven by `useDockDriver`. Position/rotation are the
  // at-rest anchor or the shared "drawer-extended" pose depending on
  // the scene-store phase.
  const groupRef = useRef<THREE.Group>(null);
  // Inner group — owns the drawer-slide hover animation. Kept separate
  // from the dock-driven outer group so the two transforms compose cleanly.
  const hoverGroupRef = useRef<THREE.Group>(null);
  const cardMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const hoverRef = useRef(0);
  const [w, h, d] = SKILLS_CATALOG_SIZE;
  const accent = getAccent();

  // Focus restoration (P9-08 parity with ProjectBook.tsx). Radix Dialog's
  // built-in restoration loses the opener when the trigger is portaled
  // through drei `<Html>`, so we drive it explicitly from the phase machine.
  const phase = useSceneStore((s) => s.phase);
  const activePanel = useSceneStore((s) => s.activePanel);
  const reducedMotion = usePrefsStore((s) => s.reducedMotion);
  const presentation = useDiegeticPresentation();
  const isSkillsActive = activePanel?.kind === 'skills';
  const wasActiveRef = useRef(false);
  useEffect(() => {
    if (isSkillsActive && (phase === 'docked' || phase === 'opening')) {
      wasActiveRef.current = true;
    }
    if (phase === 'closed' && wasActiveRef.current) {
      anchorRef.current?.focus();
      wasActiveRef.current = false;
    }
  }, [phase, isSkillsActive]);

  // Dock driver on the outer group. Home = the at-rest desk anchor, target
  // = the shared `POSES.skillsCatalog` "drawer-extended" composition.
  useDockDriver(
    groupRef,
    POSES.skillsCatalog,
    { position: SKILLS_CATALOG_POSITION, rotation: [0, 0, 0] },
    reducedMotion,
    isSkillsActive,
  );

  // Diegetic body gate. The drawer-slide hover animation is purely
  // cosmetic and runs regardless — only the DOM body mounts here.
  const showDiegeticBody =
    isSkillsActive &&
    presentation === 'diegetic' &&
    (phase === 'docked' || phase === 'opening' || phase === 'open');

  // Diegetic path has no PanelFrame to drive `opening → open` /
  // `closing → closed` timers — this hook supplies them when the
  // catalog owns the active diegetic panel.
  useDockPhaseTimers(isSkillsActive && presentation === 'diegetic');

  useFrame(() => {
    // Hover lift lives on the inner group so it composes with the dock
    // driver's outer-group writes without fighting for the same slot.
    const hoverGroup = hoverGroupRef.current;
    if (hoverGroup) {
      hoverGroup.position.y = HOVER_LIFT * hoverRef.current;
    }
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
    <group ref={groupRef} position={SKILLS_CATALOG_POSITION} name="skillsCatalog">
      <group ref={hoverGroupRef}>
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

        {/* Named drawer-face group. Origin sits flush with the +Z face of
            the drawer housing so `<Html transform>` lands on the visible
            face. Matches `POSES.skillsCatalog.surfaceNode`. */}
        <group
          name="skillsCatalog:drawer"
          position={[0, 0, d / 2 + 0.001]}
        >
          {showDiegeticBody ? (
            <group scale={w / POSES.skillsCatalog.domSize.w}>
              <Html
                transform
                occlude={false}
                pointerEvents="auto"
                style={{
                  width: `${POSES.skillsCatalog.domSize.w}px`,
                  height: `${POSES.skillsCatalog.domSize.h}px`,
                }}
              >
                <SkillsCatalogPanel
                  onClose={() => sceneStore.getState().close()}
                />
              </Html>
            </group>
          ) : null}
        </group>
      </group>

      <Html center>
        <div
          ref={anchorRef}
          tabIndex={TAB_ORDER.skillsCatalog}
          role="button"
          aria-haspopup="dialog"
          aria-label="Skills catalog — press Enter to open"
          data-testid="skills-catalog-hotspot"
          className="scene-focus-ring"
          onKeyDown={onKeyDown}
          style={{ width: 0, height: 0, opacity: 0 }}
        />
      </Html>
    </group>
  );
};
