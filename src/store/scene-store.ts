import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import { track } from '@/telemetry/events';

export type PanelPhase = 'closed' | 'opening' | 'open' | 'closing';

export type ActivePanel =
  | { kind: 'project'; id: string }
  | { kind: 'skills' }
  | { kind: 'globe' };

export interface SceneState {
  phase: PanelPhase;
  activePanel: ActivePanel | null;
  hoveredObject: string | null;
  openedAt: number | null;
  open: (panel: ActivePanel) => void;
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

  open: (panel) => {
    if (get().phase !== 'closed') return;
    const openedAt = now();
    set({ phase: 'opening', activePanel: panel, openedAt });
    if (panel.kind === 'project') {
      track({ name: 'panel.opened', projectId: panel.id });
    }
  },

  markOpened: () => {
    if (get().phase !== 'opening') return;
    set({ phase: 'open' });
  },

  close: () => {
    const { phase, activePanel, openedAt } = get();
    if (phase === 'closed' || phase === 'closing') return;
    set({ phase: 'closing' });
    if (activePanel?.kind === 'project') {
      const dwellMs = openedAt !== null ? now() - openedAt : 0;
      track({ name: 'panel.closed', projectId: activePanel.id, dwellMs });
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
