'use client';

import { useEffect, useRef } from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { Project } from '@/content/projects/schemas';
import { sceneStore, useSceneStore } from '@/store/scene-store';
import { usePrefsStore } from '@/store/prefs-store';
import { createPointerHandlers } from '@/interaction/pointer';
import { useDockDriver } from '@/interaction/camera-dock/driver';
import { POSES } from '@/interaction/camera-dock/poses';
import { useDiegeticPresentation } from '@/interaction/camera-dock/presentation';
import { useDockPhaseTimers } from '@/interaction/camera-dock/phase-timers';
import { ProjectPanel } from '@/ui/panels/ProjectPanel';
import {
  HERO_BOOK_POSITION,
  HERO_BOOK_ROTATION,
  HERO_BOOK_SIZE,
  HERO_PAGE_FAN_RAD,
} from '@/scene/hero-book/positions';

export interface HeroBookProps {
  project: Project;
  tabIndex: number;
}

const COVER_THICKNESS = 0.006;
const PAGE_THICKNESS = 0.0015;
const SPINE_WIDTH = 0.012;
const COVER_COLOR = '#3a2015';
const PAGE_COLOR = '#f2ead8';
const SPINE_COLOR = '#2a150c';

// `HeroBook` is the open, tilted hardcover at the desk centre that
// presents the author's own project (Atelier) as the entry case study.
// Geometry rules:
// - Spine runs along the local Y axis (thin vertical dimension).
// - Two pages fan symmetrically off the spine at `HERO_PAGE_FAN_RAD`
//   (~10°) so the book reads as open rather than closed flat.
// - The right page carries the `surfaceNode` name `heroBook:page`
//   consumed by the camera-dock `<Html transform>` helper in P10-16.
// The component is dockable: `{ kind: 'project', id: 'atelier' }` runs
// the dock phase machine via the shared driver. The 2D fallback body is
// the standard `ProjectPanel` rendered by Scene.tsx when the panel is
// active; when Stage B lands, `<Html transform>` mounts on
// `heroBook:page` during the `docked` / `opening` / `open` phases.
export const HeroBook = ({
  project,
  tabIndex,
}: HeroBookProps): React.ReactElement => {
  const groupRef = useRef<THREE.Group>(null);
  const anchorRef = useRef<HTMLDivElement>(null);

  const [bookWidth, , bookDepth] = HERO_BOOK_SIZE;
  const pageWidth = (bookWidth - SPINE_WIDTH) / 2;
  const pageDepth = bookDepth - 0.01;
  const halfPage = pageWidth / 2;

  const phase = useSceneStore((s) => s.phase);
  const activeId = useSceneStore((s) =>
    s.activePanel?.kind === 'project' ? s.activePanel.id : null,
  );
  const reducedMotion = usePrefsStore((s) => s.reducedMotion);
  const presentation = useDiegeticPresentation();
  const isActive = activeId === project.id;
  const wasActiveRef = useRef(false);

  // <Html transform> mount gate: the diegetic surface only hosts the panel
  // body while (a) this object owns the active panel, (b) the visitor is
  // on the diegetic path, and (c) the dock has arrived at the reading
  // pose. Reduced-motion snaps the dock (driver step = single frame) so
  // the body still mounts, but §11.5 routes reduced-motion to the 2D
  // panel via useDiegeticPresentation — so in practice this branch only
  // lights up when motion is allowed.
  const showDiegeticBody =
    isActive &&
    presentation === 'diegetic' &&
    (phase === 'docked' || phase === 'opening' || phase === 'open');

  // Diegetic path has no PanelFrame to run the `opening → open` and
  // `closing → closed` timers, so this hook fills that gap whenever this
  // object owns the active diegetic panel.
  useDockPhaseTimers(isActive && presentation === 'diegetic');

  // Focus restoration: when the panel closes, return focus to the hero
  // hotspot (mirrors ProjectBook.tsx / SkillsCatalog.tsx). Driven off
  // the scene-store phase so Radix Dialog's own restoration doesn't
  // race with the portal teardown.
  useEffect(() => {
    if (isActive && (phase === 'docked' || phase === 'opening')) {
      wasActiveRef.current = true;
    }
    if (phase === 'closed' && wasActiveRef.current) {
      anchorRef.current?.focus();
      wasActiveRef.current = false;
    }
  }, [phase, isActive]);

  // Dock driver — target pose comes from the shared POSES table so the
  // surface helper (P10-08) reads a consistent `heroBook:page` anchor.
  // Home pose is the at-rest composition anchor. The driver is a thin
  // useFrame hook; mounting it in Stage A lets P10-16 wire the phase
  // machine to real camera motion without touching this file.
  useDockDriver(
    groupRef,
    POSES.heroBook,
    { position: HERO_BOOK_POSITION, rotation: HERO_BOOK_ROTATION },
    reducedMotion,
  );

  const handlers = createPointerHandlers(project.id);

  const openPanel = (): void => {
    sceneStore.getState().open({ kind: 'project', id: project.id });
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    openPanel();
  };

  return (
    <group
      ref={groupRef}
      position={HERO_BOOK_POSITION}
      rotation={HERO_BOOK_ROTATION}
      name="heroBook"
    >
      <group {...handlers}>
        {/* Back cover — lies on the desk, spine along the local Y axis
            (thin vertical dimension matches the spine orientation). */}
        <mesh
          position={[0, -COVER_THICKNESS / 2, 0]}
          receiveShadow
          castShadow
        >
          <boxGeometry args={[bookWidth, COVER_THICKNESS, bookDepth]} />
          <meshStandardMaterial
            color={COVER_COLOR}
            roughness={0.55}
            metalness={0.08}
          />
        </mesh>

        {/* Spine strip — narrow vertical box running along local Y,
            bridging the two pages. */}
        <mesh position={[0, 0, 0]} receiveShadow>
          <boxGeometry args={[SPINE_WIDTH, PAGE_THICKNESS * 2, pageDepth]} />
          <meshStandardMaterial color={SPINE_COLOR} roughness={0.7} />
        </mesh>

        {/* Left page — pivots on the +X edge of its local frame (the
            spine hinge) and tilts up by HERO_PAGE_FAN_RAD to fan open. */}
        <group
          position={[-SPINE_WIDTH / 2, 0, 0]}
          rotation={[0, 0, HERO_PAGE_FAN_RAD]}
        >
          <mesh
            position={[-halfPage, 0, 0]}
            receiveShadow
          >
            <boxGeometry args={[pageWidth, PAGE_THICKNESS, pageDepth]} />
            <meshStandardMaterial
              color={PAGE_COLOR}
              roughness={0.9}
              metalness={0}
            />
          </mesh>
        </group>

        {/* Right page — symmetric mirror of the left page. Named so the
            camera-dock surface helper can resolve `heroBook:page` and
            mount the `<Html transform>` reading surface. */}
        <group
          position={[SPINE_WIDTH / 2, 0, 0]}
          rotation={[0, 0, -HERO_PAGE_FAN_RAD]}
          name="heroBook:page"
        >
          <mesh
            position={[halfPage, 0, 0]}
            receiveShadow
          >
            <boxGeometry args={[pageWidth, PAGE_THICKNESS, pageDepth]} />
            <meshStandardMaterial
              color={PAGE_COLOR}
              roughness={0.9}
              metalness={0}
            />
          </mesh>

          {/* Diegetic reading surface — hosts the same `ProjectPanel` body
              the 2D fallback renders, so the a11y tree is identical across
              paths. Mounted flat on the page (rotated to lie on top of the
              fanned page plane, +Y is "out" of the page), scaled so the
              authored POSES DOM width fits the world-space page width. */}
          {showDiegeticBody ? (
            <group
              position={[halfPage, PAGE_THICKNESS / 2 + 0.0005, 0]}
              rotation={[-Math.PI / 2, 0, 0]}
              scale={pageWidth / POSES.heroBook.domSize.w}
            >
              <Html
                transform
                occlude={false}
                pointerEvents="auto"
                style={{
                  width: `${POSES.heroBook.domSize.w}px`,
                  height: `${POSES.heroBook.domSize.h}px`,
                }}
              >
                <ProjectPanel
                  project={project}
                  onClose={() => sceneStore.getState().close()}
                />
              </Html>
            </group>
          ) : null}
        </group>
      </group>

      {/* Hotspot — zero-size DOM anchor that carries testid, tabIndex,
          keyboard handler, and focus ring. Mirrors the ProjectBook /
          Globe / SkillsCatalog pattern so focus restoration runs off
          the same scene-store phase machine. */}
      <Html center>
        <div
          ref={anchorRef}
          tabIndex={tabIndex}
          role="button"
          aria-haspopup="dialog"
          aria-label={`Open ${project.title}`}
          data-testid="hero-book"
          className="scene-focus-ring"
          onKeyDown={onKeyDown}
          style={{ width: 0, height: 0, opacity: 0 }}
        />
      </Html>
    </group>
  );
};
