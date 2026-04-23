import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import { track } from '@/telemetry/events';

// Phase 10 (§4.3): dockable panels pass through `docking` (camera pathing to
// the reading pose) and `docked` (camera settled, waiting for Html transform
// to mount) before entering `opening` → `open`. Non-dockable panels (globe,
// events) keep the short `closed → opening → open` path.
export type PanelPhase =
  | 'closed'
  | 'docking'
  | 'docked'
  | 'opening'
  | 'open'
  | 'closing';

export type ActivePanel =
  | { kind: 'project'; id: string }
  | { kind: 'skills' }
  | { kind: 'globe' }
  | { kind: 'events' }
  | { kind: 'contact' };

// Kind-based routing for dockable vs non-dockable presentation. Matches §5.5:
// `project`, `skills`, `contact` dock diegetically in the scene; `globe` and
// `events` render 2D without a camera pathing preamble.
const isDockableKind = (p: ActivePanel): boolean =>
  p.kind === 'project' || p.kind === 'skills' || p.kind === 'contact';

export const panelIdOf = (p: ActivePanel): string => {
  switch (p.kind) {
    case 'project':
      return `project:${p.id}`;
    case 'skills':
      return 'skills';
    case 'globe':
      return 'globe';
    case 'events':
      return 'events';
    case 'contact':
      return 'contact';
  }
};

export interface SceneState {
  phase: PanelPhase;
  activePanel: ActivePanel | null;
  hoveredObject: string | null;
  openedAt: number | null;
  open: (panel: ActivePanel) => void;
  settleDock: () => void;
  startOpening: () => void;
  markOpened: () => void;
  close: () => void;
  markClosed: () => void;
  setHovered: (id: string | null) => void;
}

const now = (): number =>
  typeof performance !== 'undefined' ? performance.now() : Date.now();

export const sceneStore = createStore<SceneState>((set, get) => ({
  phase: 'closed',
  activePanel: null,
  hoveredObject: null,
  openedAt: null,

  // At-most-one invariant: only accept `open()` from the `closed` phase.
  // `panel.opened` fires here (not on `→ open`) because the panel's identity
  // is committed at this moment, and firing at `markOpened()` would delay
  // analytics by an animation-dependent amount that differs between dockable
  // (long dock + mount) and non-dockable (short) paths, skewing dwell math.
  open: (panel) => {
    if (get().phase !== 'closed') return;
    const openedAt = now();
    const nextPhase: PanelPhase = isDockableKind(panel) ? 'docking' : 'opening';
    set({ phase: nextPhase, activePanel: panel, openedAt });
    track({ name: 'panel.opened', panelId: panelIdOf(panel) });
  },

  // Camera-dock driver calls this on `path end` (docking → docked).
  settleDock: () => {
    if (get().phase !== 'docking') return;
    set({ phase: 'docked' });
  },

  // Camera-dock driver calls this at t+0 after settleDock so the `<Html
  // transform>` can mount in `opening`. Separating it from `settleDock` lets
  // the driver interleave any post-settle work before mount.
  startOpening: () => {
    if (get().phase !== 'docked') return;
    set({ phase: 'opening' });
  },

  markOpened: () => {
    if (get().phase !== 'opening') return;
    set({ phase: 'open' });
  },

  // Close is accepted from any live phase (docking | docked | opening | open).
  // The camera driver runs the reverse-dock animation during `closing`; the
  // store only tracks the single `closing` phase.
  close: () => {
    const { phase, activePanel, openedAt } = get();
    if (phase === 'closed' || phase === 'closing') return;
    set({ phase: 'closing' });
    if (activePanel) {
      const dwellMs = openedAt !== null ? now() - openedAt : 0;
      track({
        name: 'panel.closed',
        panelId: panelIdOf(activePanel),
        dwellMs,
      });
    }
  },

  markClosed: () => {
    if (get().phase !== 'closing') return;
    set({ phase: 'closed', activePanel: null, openedAt: null });
  },

  setHovered: (id) => set({ hoveredObject: id }),
}));

export const useSceneStore = <T>(selector: (s: SceneState) => T): T =>
  useStore(sceneStore, selector);
