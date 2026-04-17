'use client';

import { useEffect } from 'react';
import { sceneStore } from '@/store/scene-store';

const isTextEditingFocus = (): boolean => {
  if (typeof document === 'undefined') return false;
  const el = document.activeElement;
  if (!(el instanceof Element)) return false;
  const tag = el.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA') return true;
  const editable = (el as HTMLElement).getAttribute('contenteditable');
  return editable === 'true' || editable === '';
};

const onKeyDown = (event: KeyboardEvent): void => {
  if (event.key !== 'Escape') return;
  if (isTextEditingFocus()) return;
  const { phase } = sceneStore.getState();
  if (phase !== 'open' && phase !== 'opening') return;
  sceneStore.getState().close();
};

export const useGlobalKeyboard = (): void => {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
};
