'use client';

import { useEffect } from 'react';
import { sceneStore, type ActivePanel } from '@/store/scene-store';
import { prefsStore, type PresentationMode } from '@/store/prefs-store';

const isTextEditingFocus = (): boolean => {
  if (typeof document === 'undefined') return false;
  const el = document.activeElement;
  if (!(el instanceof Element)) return false;
  const tag = el.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA') return true;
  const editable = (el as HTMLElement).getAttribute('contenteditable');
  return editable === 'true' || editable === '';
};

// Cycle: auto → diegetic → panel → auto. Justification: `auto` is the default
// and where most visitors live; `V` first reveals the novel (diegetic) form,
// pressing again reveals the practical (panel) form, a third press returns
// to auto. This matches the §5.5 mental model of "show fancy, show plain,
// stop thinking".
const NEXT_PRESENTATION: Record<PresentationMode, PresentationMode> = {
  auto: 'diegetic',
  diegetic: 'panel',
  panel: 'auto',
};

// Panel kinds addressable via Shift+Enter hotspot. Matches `ActivePanel`.
const KIND_VALUES = ['project', 'skills', 'globe', 'events', 'contact'] as const;
type PanelKind = (typeof KIND_VALUES)[number];
const isPanelKind = (v: string | null): v is PanelKind =>
  v !== null && (KIND_VALUES as readonly string[]).includes(v);

const dockableFromFocus = (): ActivePanel | null => {
  if (typeof document === 'undefined') return null;
  const el = document.activeElement;
  if (!(el instanceof HTMLElement)) return null;
  if (el.dataset['dockable'] !== 'true') return null;
  const kindRaw = el.dataset['panelKind'] ?? null;
  if (!isPanelKind(kindRaw)) return null;
  if (kindRaw === 'project') {
    const id = el.dataset['panelId'] ?? '';
    if (!id) return null;
    return { kind: 'project', id };
  }
  return { kind: kindRaw };
};

// Unsubscribe handle for the prefs revert-on-close subscription. Kept
// module-scoped so repeated Shift+Enter invocations don't leak listeners.
let revertUnsub: (() => void) | null = null;
const armRevertOnClose = (): void => {
  if (revertUnsub) {
    revertUnsub();
    revertUnsub = null;
  }
  revertUnsub = sceneStore.subscribe((s, prev) => {
    // Transition → closed: restore presentationMode to auto and detach.
    if (prev.phase !== 'closed' && s.phase === 'closed') {
      prefsStore.getState().setPresentationMode('auto');
      if (revertUnsub) {
        revertUnsub();
        revertUnsub = null;
      }
    }
  });
};

const onKeyDown = (event: KeyboardEvent): void => {
  // Shift+Enter on a dockable hotspot: force 2D panel form, then open().
  // Dispatched before the text-editing guard because the hotspot itself is
  // the focused element (not an editing surface).
  if (event.key === 'Enter' && event.shiftKey) {
    const target = dockableFromFocus();
    if (target) {
      prefsStore.getState().setPresentationMode('panel');
      armRevertOnClose();
      sceneStore.getState().open(target);
      event.preventDefault();
      return;
    }
    return;
  }

  // Text-editing guard — skip remaining handlers when focus is in an input.
  if (isTextEditingFocus()) return;

  if (event.key === 'Escape') {
    const { phase } = sceneStore.getState();
    // Escape is valid from any live phase — interrupting a dock mid-path is
    // supported per §4.3 ("Close from `docking`: reverse dock"). `close()` itself
    // no-ops on `closed` / `closing`, so the guard here just avoids calling it
    // when there's nothing to close.
    if (phase === 'closed' || phase === 'closing') return;
    sceneStore.getState().close();
    return;
  }

  // `V` toggles presentationMode while the panel is docked or live. Single-key
  // binding (not Shift+V) — the text-editing guard above handles conflicts.
  if (event.key === 'v' || event.key === 'V') {
    const { phase } = sceneStore.getState();
    if (phase === 'closed' || phase === 'closing') return;
    const current = prefsStore.getState().presentationMode;
    prefsStore.getState().setPresentationMode(NEXT_PRESENTATION[current]);
    return;
  }
};

export const useGlobalKeyboard = (): void => {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
};
