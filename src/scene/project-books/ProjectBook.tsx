'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { Project } from '@/content/projects/schemas';
import { sceneStore, useSceneStore } from '@/store/scene-store';
import { usePrefsStore } from '@/store/prefs-store';
import { createPointerHandlers } from '@/interaction/pointer';
import {
  spineDimensions,
  spineMaterialParams,
} from '@/scene/project-books/spine-design';
import { getAccent } from '@/ui/controls/accent';
import { durations } from '@/ui/motion/tokens';

const HOVER_LIFT = 0.003;
const PULL_Z = 0.03;
const HOVER_GLOW = 0.1;
const COVER_FLIP = Math.PI;
const FACE_ROTATE = -Math.PI / 2;

export interface ProjectBookProps {
  project: Project;
  stackIndex: number;
  position: [number, number, number];
  tabIndex: number;
}

export const ProjectBook = ({
  project,
  position,
  tabIndex,
}: ProjectBookProps): React.ReactElement => {
  const outerRef = useRef<THREE.Group>(null);
  const coverPivotRef = useRef<THREE.Group>(null);
  const spineMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const anchorRef = useRef<HTMLDivElement>(null);

  const dims = useMemo(() => spineDimensions(project.spine), [project.spine]);
  const baseSpineParams = useMemo(
    () => spineMaterialParams(project.spine, getAccent()),
    [project.spine],
  );

  // Animation state lives in a ref so useFrame mutates without re-rendering.
  const anim = useRef({
    hover: 0,
    open: 0,
    direction: 'idle' as 'idle' | 'forward' | 'reverse',
    wasActive: false,
  });

  const phase = useSceneStore((s) => s.phase);
  const activeId = useSceneStore((s) =>
    s.activePanel?.kind === 'project' ? s.activePanel.id : null,
  );
  const hoveredId = useSceneStore((s) => s.hoveredObject);
  // Sourcing reducedMotion from prefs-store keeps the value reactive to OS
  // toggles (subscribeToReducedMotion bridges matchMedia → store) and matches
  // the single-source-of-truth pattern from Phase 5 Deviation 2.
  const reducedMotion = usePrefsStore((s) => s.reducedMotion);
  const isHovered = hoveredId === project.id;
  const isActive = activeId === project.id;

  const handlers = useMemo(
    () => createPointerHandlers(project.id),
    [project.id],
  );

  // Drive animation direction from phase transitions on the active book.
  useEffect(() => {
    if (isActive) {
      if (phase === 'opening') {
        anim.current.direction = 'forward';
        anim.current.wasActive = true;
      } else if (phase === 'closing') {
        anim.current.direction = 'reverse';
      }
    }
    // Focus restoration happens the moment the store clears activePanel —
    // decoupled from the book's own 800 ms close animation so keyboard users
    // get focus back as soon as the panel DOM is gone.
    if (phase === 'closed' && anim.current.wasActive) {
      anchorRef.current?.focus();
      anim.current.wasActive = false;
    }
  }, [phase, isActive]);

  useFrame((_, delta) => {
    const a = anim.current;

    // Hover lerp (10% of frame; clamp 0..1).
    const hoverTarget = isHovered ? 1 : 0;
    a.hover += (hoverTarget - a.hover) * 0.1;

    // Open animation progress with prefers-reduced-motion shortcut.
    const ms = reducedMotion ? durations.fast : durations.bookOpen;
    const step = (delta * 1000) / ms;

    if (a.direction === 'forward') {
      a.open = Math.min(1, a.open + step);
      if (a.open >= 1) {
        a.direction = 'idle';
        sceneStore.getState().markOpened();
      }
    } else if (a.direction === 'reverse') {
      a.open = Math.max(0, a.open - step);
      if (a.open <= 0) {
        a.direction = 'idle';
        sceneStore.getState().markClosed();
      }
    }

    const outer = outerRef.current;
    if (outer) {
      outer.position.set(
        position[0],
        position[1] + HOVER_LIFT * a.hover,
        position[2] + PULL_Z * a.open,
      );
      const rotate = reducedMotion ? 0 : FACE_ROTATE * a.open;
      outer.rotation.y = rotate;
    }

    const cover = coverPivotRef.current;
    if (cover) {
      cover.rotation.y = COVER_FLIP * a.open;
    }

    const mat = spineMatRef.current;
    if (mat) {
      mat.emissiveIntensity =
        baseSpineParams.emissiveIntensity + HOVER_GLOW * a.hover;
    }
  });

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    sceneStore.getState().open({ kind: 'project', id: project.id });
  };

  const halfW = dims.width / 2;
  const halfD = dims.depth / 2;

  return (
    <group ref={outerRef} position={position}>
      <group {...handlers}>
        {/* Pages block (thickest interior). */}
        <mesh castShadow receiveShadow>
          <boxGeometry
            args={[dims.width * 0.9, dims.height * 0.98, dims.depth * 0.95]}
          />
          <meshStandardMaterial color="#f2ead8" roughness={0.95} />
        </mesh>

        {/* Cover pivot rotates around the spine hinge at +X edge of the book. */}
        <group ref={coverPivotRef} position={[halfW, 0, 0]}>
          <mesh
            castShadow
            receiveShadow
            position={[-halfW, 0, 0]}
          >
            <boxGeometry args={[dims.width, dims.height, dims.depth]} />
            <meshStandardMaterial
              color={project.spine.color}
              roughness={baseSpineParams.roughness}
              metalness={baseSpineParams.metalness}
            />
          </mesh>
          {/* Spine stripe on the -Z face of the cover. */}
          <mesh
            position={[-halfW, 0, -halfD + 0.001]}
            castShadow
          >
            <boxGeometry
              args={[dims.width * 1.02, dims.height, 0.002]}
            />
            <meshStandardMaterial
              ref={spineMatRef}
              color={project.spine.color}
              roughness={baseSpineParams.roughness}
              metalness={baseSpineParams.metalness}
              emissive={baseSpineParams.emissive}
              emissiveIntensity={baseSpineParams.emissiveIntensity}
            />
          </mesh>
        </group>
      </group>

      <Html center>
        <div
          ref={anchorRef}
          tabIndex={tabIndex}
          role="button"
          aria-haspopup="dialog"
          aria-label={`Open ${project.title}`}
          data-testid={`project-book-${project.id}`}
          onKeyDown={onKeyDown}
          style={{ width: 0, height: 0, opacity: 0 }}
        />
      </Html>
    </group>
  );
};
