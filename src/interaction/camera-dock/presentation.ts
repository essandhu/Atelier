'use client';

// §5.5 "Dual-path rendering" — resolves whether a dockable panel should
// render diegetically (Html transform on the object's named surface) or via
// the 2D PanelFrame.
//
// Resolution order (explicit modes beat auto triggers):
//   1. presentationMode === 'diegetic' → 'diegetic' (user override, even
//      with reducedMotion / narrow viewport)
//   2. presentationMode === 'panel'    → 'panel'
//   3. reducedMotion                  → 'panel'
//   4. narrow viewport (≤480px)       → 'panel'
//   5. else                           → 'diegetic'
//
// This hook is the single source of truth consumed by every dockable
// component + Scene.tsx's ActivePanelRenderer, so the two paths stay in
// lockstep — there is no branch where both mount at once.

import { usePrefsStore } from '@/store/prefs-store';
import { useIsNarrowViewport } from '@/lib/use-narrow-viewport';

export type Presentation = 'diegetic' | 'panel';

export const useDiegeticPresentation = (): Presentation => {
  const mode = usePrefsStore((s) => s.presentationMode);
  const reducedMotion = usePrefsStore((s) => s.reducedMotion);
  const narrow = useIsNarrowViewport();

  if (mode === 'diegetic') return 'diegetic';
  if (mode === 'panel') return 'panel';
  if (reducedMotion) return 'panel';
  if (narrow) return 'panel';
  return 'diegetic';
};
