'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { sceneStore, useSceneStore } from '@/store/scene-store';
import { prefsStore, usePrefsStore } from '@/store/prefs-store';
import { TAB_ORDER } from '@/interaction/tab-order';
import {
  IDLE_SPIN_RATE,
  impartMomentumFromDrag,
  stepMomentum,
} from '@/scene/globe/momentum';
import {
  GLOBE_POSITION,
  GLOBE_RADIUS,
  markerCartesian,
} from '@/scene/globe/positions';
import { locationCoordinates } from '@/content/profile-location';
import { getAccent } from '@/ui/controls/accent';
import { track } from '@/telemetry/events';

const DECAY = 0.9;
const HOVER_LIFT = 0.001;
const CLICK_THRESHOLD_PX = 2;
const REDUCED_MOTION_DAMPING = 0.1;
const PIXELS_PER_RADIAN_LOCAL = 200;
const HOTSPOT_PX = 96;

type PointerInfo = {
  startX: number;
  startTs: number;
  lastX: number;
  captured: boolean;
  totalRadians: number;
  moved: boolean;
};

/**
 * Interaction lives on the HTML hotspot rather than the 3D mesh so the
 * drag surface has a deterministic DOM bounding box (e2e-friendly) and
 * so Playwright's synthetic pointer events flow without `setPointerCapture`
 * quirks. The sphere is purely visual; `sphereRef.current.rotation.y`
 * is driven from the hotspot's pointer handlers.
 */
export const Globe = (): React.ReactElement => {
  const groupRef = useRef<THREE.Group>(null);
  const sphereRef = useRef<THREE.Mesh>(null);
  const markerMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const hoverRef = useRef(0);
  const angularVelocityRef = useRef(IDLE_SPIN_RATE);
  const rotationRef = useRef(0);
  const pointerRef = useRef<PointerInfo>({
    startX: 0,
    startTs: 0,
    lastX: 0,
    captured: false,
    totalRadians: 0,
    moved: false,
  });
  const reducedMotionRef = useRef<boolean>(
    prefsStore.getState().reducedMotion,
  );
  const accent = useMemo(() => getAccent(), []);
  const reducedMotion = usePrefsStore((s) => s.reducedMotion);

  const markerPosition = useMemo(
    () =>
      markerCartesian(
        locationCoordinates.lat,
        locationCoordinates.lon,
        GLOBE_RADIUS * 1.02,
      ),
    [],
  );

  useEffect(() => {
    reducedMotionRef.current = prefsStore.getState().reducedMotion;
    return prefsStore.subscribe((s) => {
      reducedMotionRef.current = s.reducedMotion;
    });
  }, []);

  // Focus restoration (P9-08 parity with ProjectBook.tsx). Radix Dialog's
  // built-in restoration loses the opener when the trigger is portaled
  // through drei `<Html>`, so we drive it explicitly from the phase machine.
  const phase = useSceneStore((s) => s.phase);
  const activePanel = useSceneStore((s) => s.activePanel);
  const wasActiveRef = useRef(false);
  useEffect(() => {
    const isGlobeActive = activePanel?.kind === 'globe';
    if (isGlobeActive && phase === 'opening') {
      wasActiveRef.current = true;
    }
    if (phase === 'closed' && wasActiveRef.current) {
      anchorRef.current?.focus();
      wasActiveRef.current = false;
    }
  }, [phase, activePanel]);

  useFrame((_, delta) => {
    const sphere = sphereRef.current;
    const group = groupRef.current;
    if (!sphere || !group) return;

    const idle = reducedMotionRef.current ? 0 : IDLE_SPIN_RATE;
    angularVelocityRef.current = stepMomentum(
      angularVelocityRef.current,
      delta,
      DECAY,
    );

    // Under reduced motion, any residual velocity (including the seeded
    // IDLE_SPIN_RATE) should settle to zero rather than loop at the floor.
    if (reducedMotionRef.current && Math.abs(angularVelocityRef.current) < IDLE_SPIN_RATE) {
      angularVelocityRef.current = 0;
    }

    const signedFloor = angularVelocityRef.current >= 0 ? idle : -idle;
    const effectiveVelocity =
      Math.abs(angularVelocityRef.current) < idle
        ? signedFloor
        : angularVelocityRef.current;

    if (!pointerRef.current.captured) {
      rotationRef.current += effectiveVelocity * delta;
      sphere.rotation.y = rotationRef.current;
    }

    const hoverTarget = hoverRef.current;
    const mat = markerMatRef.current;
    if (mat) {
      mat.emissiveIntensity = 0.4 + 0.6 * hoverTarget;
    }
    group.position.y = GLOBE_POSITION[1] + HOVER_LIFT * hoverTarget;

    const anchor = anchorRef.current;
    if (anchor) {
      anchor.dataset.globeRotation = rotationRef.current.toFixed(3);
    }
  });

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>): void => {
    pointerRef.current = {
      startX: event.clientX,
      startTs: performance.now(),
      lastX: event.clientX,
      captured: true,
      totalRadians: 0,
      moved: false,
    };
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>): void => {
    if (!pointerRef.current.captured) return;
    const sphere = sphereRef.current;
    if (!sphere) return;
    const dx = event.clientX - pointerRef.current.lastX;
    if (dx === 0) return;
    pointerRef.current.lastX = event.clientX;
    const radians = dx / PIXELS_PER_RADIAN_LOCAL;
    rotationRef.current += radians;
    pointerRef.current.totalRadians += radians;
    pointerRef.current.moved = true;
    sphere.rotation.y = rotationRef.current;
  };

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>): void => {
    const info = pointerRef.current;
    if (!info.captured) return;
    info.captured = false;

    const dx = event.clientX - info.startX;
    const durationMs = Math.max(1, performance.now() - info.startTs);

    if (!info.moved || Math.abs(dx) < CLICK_THRESHOLD_PX) {
      sceneStore.getState().open({ kind: 'globe' });
      return;
    }

    let v = impartMomentumFromDrag(dx, durationMs);
    if (reducedMotionRef.current) v *= REDUCED_MOTION_DAMPING;
    angularVelocityRef.current = v;
    track({
      name: 'globe.spun',
      durationMs,
      totalRadians: info.totalRadians,
    });
  };

  const onPointerOver = (): void => {
    hoverRef.current = 1;
    sceneStore.getState().setHovered('globe');
  };

  const onPointerOut = (): void => {
    hoverRef.current = 0;
    sceneStore.getState().setHovered(null);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    sceneStore.getState().open({ kind: 'globe' });
  };

  return (
    <group ref={groupRef} position={GLOBE_POSITION}>
      {/* Stand */}
      <mesh position={[0, -GLOBE_RADIUS - 0.02, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.02, 0.025, 0.04, 16]} />
        <meshStandardMaterial color="#3b2a1f" roughness={0.7} metalness={0.1} />
      </mesh>

      {/* Spin axis (thin cylinder through poles) */}
      <mesh castShadow>
        <cylinderGeometry args={[0.003, 0.003, GLOBE_RADIUS * 2.3, 8]} />
        <meshStandardMaterial color="#8b6a3a" roughness={0.5} metalness={0.3} />
      </mesh>

      {/* Globe sphere — purely visual; pointer handling is on the Html hotspot */}
      <mesh ref={sphereRef} castShadow receiveShadow>
        <sphereGeometry args={[GLOBE_RADIUS, 32, 24]} />
        <meshStandardMaterial
          color="#2c4c6e"
          roughness={0.6}
          metalness={0.05}
        />
        {/* Marker rides the sphere's local frame, so it rotates with the globe */}
        <mesh position={markerPosition}>
          <sphereGeometry args={[0.004, 12, 8]} />
          <meshStandardMaterial
            ref={markerMatRef}
            color={accent}
            emissive={accent}
            emissiveIntensity={0.4}
            roughness={0.4}
            metalness={0.1}
          />
        </mesh>
      </mesh>

      <Html center>
        <div
          ref={anchorRef}
          tabIndex={TAB_ORDER.globe}
          role="button"
          aria-haspopup="dialog"
          aria-label="Globe — press Enter to open location details"
          data-testid="globe-hotspot"
          data-globe-rotation="0.000"
          data-reduced-motion={reducedMotion ? 'true' : 'false'}
          className="scene-focus-ring"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerEnter={onPointerOver}
          onPointerLeave={onPointerOut}
          onKeyDown={onKeyDown}
          style={{
            width: HOTSPOT_PX,
            height: HOTSPOT_PX,
            opacity: 0,
            cursor: 'grab',
            touchAction: 'none',
          }}
        />
      </Html>
    </group>
  );
};
