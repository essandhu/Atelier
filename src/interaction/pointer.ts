'use client';

import { useCallback } from 'react';
import { sceneStore, type ActivePanel } from '@/store/scene-store';

type R3FLike = { stopPropagation: () => void };

export interface PointerHandlers {
  onPointerOver: (e: R3FLike) => void;
  onPointerOut: (e: R3FLike) => void;
  onClick: (e: R3FLike) => void;
}

const normalize = (target: string | ActivePanel): {
  hoverId: string;
  panel: ActivePanel;
} => {
  if (typeof target === 'string') {
    return { hoverId: target, panel: { kind: 'project', id: target } };
  }
  const hoverId = target.kind === 'project' ? target.id : target.kind;
  return { hoverId, panel: target };
};

export const createPointerHandlers = (
  target: string | ActivePanel,
): PointerHandlers => {
  const { hoverId, panel } = normalize(target);
  return {
    onPointerOver: (e) => {
      e.stopPropagation();
      sceneStore.getState().setHovered(hoverId);
    },
    onPointerOut: (e) => {
      e.stopPropagation();
      sceneStore.getState().setHovered(null);
    },
    onClick: (e) => {
      e.stopPropagation();
      sceneStore.getState().open(panel);
    },
  };
};

export const usePointerMissed = (): (() => void) =>
  useCallback(() => {
    const { phase } = sceneStore.getState();
    if (phase === 'closed' || phase === 'closing') return;
    sceneStore.getState().close();
  }, []);
