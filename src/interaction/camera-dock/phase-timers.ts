'use client';

import { useEffect } from 'react';
import { sceneStore, useSceneStore, type PanelPhase } from '@/store/scene-store';
import { durations } from '@/ui/motion/tokens';

// §5.5 "Dual-path rendering" — the 2D `PanelFrame` owns its own timers
// that advance the store phase (`opening → open`, `closing → closed`).
// Diegetic dockables render an `<Html transform>` body instead of a
// PanelFrame, so they lose that timer. This hook recreates the same two
// transitions on a dockable component when it owns the active panel, so
// the phase machine lands at `open` / `closed` regardless of path.
//
// Idempotency: the scene-store transitions (`markOpened`, `markClosed`)
// guard on the current phase, so firing them in both paths (PanelFrame
// + this hook) is safe — the second call no-ops.
//
// Call this hook on the dockable component that owns the active panel.
// `shouldRun = isActive && presentation === 'diegetic'` — wire once per
// dockable; the hook handles the phase-edge scheduling internally.
export const useDockPhaseTimers = (shouldRun: boolean): void => {
  const phase = useSceneStore((s) => s.phase);

  useEffect(() => {
    if (!shouldRun) return;
    if (phase === 'opening') {
      const id = window.setTimeout(() => {
        if (sceneStore.getState().phase === 'opening') {
          sceneStore.getState().markOpened();
        }
      }, durations.panel);
      return () => window.clearTimeout(id);
    }
    if (phase === 'closing') {
      const id = window.setTimeout(() => {
        if (sceneStore.getState().phase === 'closing') {
          sceneStore.getState().markClosed();
        }
      }, durations.med);
      return () => window.clearTimeout(id);
    }
    return;
  }, [shouldRun, phase]);
};

// Re-exported PanelPhase for consumers that need to narrow on specific
// phases (e.g. gating `<Html transform>` mount to docked/opening/open).
export type { PanelPhase };
