'use client';

import { useEffect, useRef, useState } from 'react';
import type * as THREE from 'three';
import { usePrefsStore } from '@/store/prefs-store';
import { useResolvedTimeOfDay } from '@/store/time-of-day-store';
import { presets } from '@/time-of-day/presets';
import { track } from '@/telemetry/events';
import type { TimeOfDayState } from '@/time-of-day/types';

const DURATION_MS: Record<TimeOfDayState, number> = {
  morning: 600,
  day: 400,
  evening: 1200,
  night: 1500,
};

export const startupDurationFor = (state: TimeOfDayState): number =>
  DURATION_MS[state];

export interface StartupSequenceProps {
  lampBulbRef: React.RefObject<THREE.Mesh | null>;
}

export const StartupSequence = ({
  lampBulbRef,
}: StartupSequenceProps): React.ReactElement | null => {
  const state = useResolvedTimeOfDay();
  const reducedMotion = usePrefsStore((s) => s.reducedMotion);
  const firedRef = useRef(false);
  const [active, setActive] = useState(!reducedMotion);
  // Match IntroOverlay's hydration gate so the initial client render agrees
  // with the server (both return null). Animation kicks in after mount.
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      setActive(false);
      return;
    }
    if (firedRef.current) return;
    firedRef.current = true;

    const duration = startupDurationFor(state);
    const target = presets[state].lampEmissionStrength;
    const start = performance.now();
    // Morning ramps to ~half its preset value, giving a "warm wake" feel.
    const peak = state === 'morning' ? target * 0.5 : target;
    let raf = 0;

    const tick = (): void => {
      const mesh = lampBulbRef.current;
      if (!mesh) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const material = mesh.material as THREE.MeshStandardMaterial | undefined;
      if (!material || !('emissiveIntensity' in material)) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const t = Math.min(1, (performance.now() - start) / duration);
      // Ease-out cubic for a cinematic lamp turn-on.
      const eased = 1 - Math.pow(1 - t, 3);
      material.emissiveIntensity = peak * eased;
      if (t < 1) {
        raf = requestAnimationFrame(tick);
        return;
      }
      material.emissiveIntensity = target;
      setActive(false);
      track({
        name: 'scene.startup_completed',
        state,
        reducedMotion,
        durationMs: duration,
      });
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [state, reducedMotion, lampBulbRef]);

  if (!hydrated || reducedMotion || !active) return null;

  return (
    <div
      data-testid="startup-sequence"
      data-state={state}
      aria-hidden="true"
      style={{ position: 'absolute', width: 0, height: 0, opacity: 0 }}
    />
  );
};
