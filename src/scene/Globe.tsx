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
// Browser default click slop is ~5 px (varies by OS/browser). The previous
// 2 px value misclassified casual clicks with normal mouse jitter as drags,
// routing them into the momentum branch (which does NOT open the panel).
const CLICK_THRESHOLD_PX = 5;
const REDUCED_MOTION_DAMPING = 0.1;
const PIXELS_PER_RADIAN_LOCAL = 200;
// Larger than the visible globe — gives a generous click target and room
// for the cursor around the sphere. `setPointerCapture` handles the rest:
// once a drag starts, pointermove keeps flowing even when the cursor
// leaves the pad, so the wider size is no longer load-bearing for drag
// continuity — it's purely hit-target ergonomics. The pad is transparent
// and positioned in empty desk space, so a wider hit area doesn't occlude
// other interactive scene objects.
const HOTSPOT_PX = 240;
// Click is treated as on-globe only when it lands within this radius of the
// hotspot centre. Approximately matches the visible sphere so empty-desk
// clicks within the wider 240×240 drag area don't open the panel.
const CLICK_RADIUS_PX = 60;

type PointerInfo = {
  pointerId: number | null;
  startX: number;
  startTs: number;
  lastX: number;
  captured: boolean;
  totalRadians: number;
  moved: boolean;
};

/**
 * Interaction is split across two surfaces:
 *
 * - **Drag-to-spin + click + hover** live on a 240×240 transparent outer
 *   pad under drei `<Html>`. `setPointerCapture` on pointerdown keeps
 *   pointermove flowing even when the cursor drifts outside the pad, so
 *   fast drags stay smooth. (An earlier revision avoided capture on the
 *   theory that it broke Playwright's synthetic pointer events — it
 *   doesn't, and without it the drag visibly stutters whenever the cursor
 *   exits the pad.)
 * - **Focus + keyboard** live on a 1×1 inner anchor absolutely positioned
 *   at the pad's centre. The anchor owns `tabIndex`, `role`, `aria-*`,
 *   and `.scene-focus-ring`, so the focus ring paints tight on the
 *   visible globe instead of wrapping the whole 240×240 pad.
 *   **Critical:** the outer pad must NOT set `opacity: 0` — CSS opacity
 *   applies to the entire subtree, so an opacity:0 parent suppresses the
 *   inner anchor's focus ring even when `:focus-visible` sets opacity to 1.
 * - **Click region is narrowed via `CLICK_RADIUS_PX`** — `onClick` only
 *   opens the panel when the click is within ~60 px of the hotspot
 *   centre, i.e. on or near the visible globe. R3F mesh `onClick` would
 *   feel right architecturally, but drei `<Html>`'s portaled div sits
 *   above the canvas in DOM order: when click bubbles from the hotspot
 *   div to R3F's canvas-parent listener, `event.offsetX/Y` is relative to
 *   the hotspot div, not the canvas — so R3F's raycaster casts from the
 *   wrong screen position and never hits the sphere.
 * - **Drag-then-click** is suppressed via `lastGestureWasDragRef`; the
 *   browser fires `click` after every pointerup-on-same-element, so drag
 *   would otherwise open the panel on release.
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
    pointerId: null,
    startX: 0,
    startTs: 0,
    lastX: 0,
    captured: false,
    totalRadians: 0,
    moved: false,
  });
  // Set to `true` by onPointerUp when the gesture qualified as a drag, so the
  // R3F mesh onClick that fires right after can skip the panel-open. Reset to
  // `false` after each click cycle.
  const lastGestureWasDragRef = useRef(false);
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
    // Stop bubbling to R3F's canvas-parent listener so its onPointerMissed
    // doesn't fire on the eventual pointerup and close a panel that the
    // click just opened.
    event.stopPropagation();
    // Route subsequent pointermove/pointerup to this element even when the
    // cursor leaves the 240×240 hotspot. Without capture, fast drags past
    // the hotspot edge drop events until the cursor re-enters — which
    // reads as choppy rotation.
    event.currentTarget.setPointerCapture(event.pointerId);
    pointerRef.current = {
      pointerId: event.pointerId,
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
    if (pointerRef.current.pointerId !== event.pointerId) return;
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

  const finishGesture = (): void => {
    pointerRef.current.captured = false;
    pointerRef.current.pointerId = null;
  };

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>): void => {
    const info = pointerRef.current;
    if (!info.captured) return;
    if (info.pointerId !== event.pointerId) return;

    event.stopPropagation();
    const dx = event.clientX - info.startX;
    const durationMs = Math.max(1, performance.now() - info.startTs);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    finishGesture();

    const wasDrag = info.moved && Math.abs(dx) >= CLICK_THRESHOLD_PX;
    lastGestureWasDragRef.current = wasDrag;

    if (wasDrag) {
      let v = impartMomentumFromDrag(dx, durationMs);
      if (reducedMotionRef.current) v *= REDUCED_MOTION_DAMPING;
      angularVelocityRef.current = v;
      track({
        name: 'globe.spun',
        durationMs,
        totalRadians: info.totalRadians,
      });
    }
  };

  const onClick = (event: React.MouseEvent<HTMLDivElement>): void => {
    event.stopPropagation();
    if (lastGestureWasDragRef.current) {
      lastGestureWasDragRef.current = false;
      return;
    }
    // Narrow the open-on-click region to the visible globe — the wider
    // hotspot is for drag, not for clicking on empty desk space.
    const rect = event.currentTarget.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dist = Math.hypot(event.clientX - cx, event.clientY - cy);
    if (dist > CLICK_RADIUS_PX) return;
    sceneStore.getState().open({ kind: 'globe' });
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

      {/* Globe sphere — purely visual; pointer/click handling lives on the
          Html hotspot. R3F mesh onClick would feel right but drei <Html>'s
          portaled div confuses R3F's raycast positioning (offsetX/Y is
          relative to the hotspot div instead of the canvas). */}
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
        {/* Outer pad: drag/click/hover surface. Sized at HOTSPOT_PX to give
            drag plenty of travel and to be a generous click target. Not
            focusable — the focus ring would otherwise wrap this whole
            240×240 area.

            NOTE: no `opacity: 0` here. CSS opacity applies to the full
            subtree, so an opacity:0 parent would hide the inner anchor's
            focus ring even when `:focus-visible` sets `opacity: 1`. The
            pad has no visible content of its own (transparent background,
            no border), so it's already invisible without the opacity
            override. */}
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerEnter={onPointerOver}
          onPointerLeave={onPointerOut}
          onClick={onClick}
          style={{
            position: 'relative',
            width: HOTSPOT_PX,
            height: HOTSPOT_PX,
            cursor: 'grab',
            touchAction: 'none',
          }}
        >
          {/* Inner anchor: focus + keyboard target. 1×1 at the centre so
              `.scene-focus-ring:focus-visible`'s 8 px min-box renders a
              tight ring on the visible globe — matching every other scene
              hotspot. testid + telemetry attrs live here so the test harness
              still queries this element via `globe-hotspot`.
              `pointerEvents: 'auto'` so Playwright's actionability check
              sees this as the topmost element at its coords (otherwise it
              reports the outer pad as "intercepting"). Pointer/click events
              bubble to the outer div, which carries the actual handlers. */}
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
            onKeyDown={onKeyDown}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 1,
              height: 1,
              opacity: 0,
            }}
          />
        </div>
      </Html>
    </group>
  );
};
