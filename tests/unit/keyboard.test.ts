// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useGlobalKeyboard } from '@/interaction/keyboard';
import { sceneStore } from '@/store/scene-store';

const dispatchKey = (key: string): KeyboardEvent => {
  const ev = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
  window.dispatchEvent(ev);
  return ev;
};

describe('useGlobalKeyboard', () => {
  beforeEach(() => {
    sceneStore.setState({
      phase: 'closed',
      activePanel: null,
      hoveredObject: null,
      openedAt: null,
    });
    (window as Window & { dataLayer?: unknown[] }).dataLayer = [];
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('Escape is a no-op while phase === closed', () => {
    const closeSpy = vi.spyOn(sceneStore.getState(), 'close');
    renderHook(() => useGlobalKeyboard());
    dispatchKey('Escape');
    expect(closeSpy).not.toHaveBeenCalled();
  });

  // Helper: drive a project (dockable) panel all the way to `open`.
  const driveProjectToOpen = (id: string): void => {
    sceneStore.getState().open({ kind: 'project', id });
    sceneStore.getState().settleDock();
    sceneStore.getState().startOpening();
    sceneStore.getState().markOpened();
  };

  it('Escape calls close() while phase === docking (before settle)', () => {
    renderHook(() => useGlobalKeyboard());
    sceneStore.getState().open({ kind: 'project', id: 'a' });
    dispatchKey('Escape');
    expect(sceneStore.getState().phase).toBe('closing');
  });

  it('Escape calls close() while phase === open', () => {
    renderHook(() => useGlobalKeyboard());
    driveProjectToOpen('a');
    dispatchKey('Escape');
    expect(sceneStore.getState().phase).toBe('closing');
  });

  it('Escape is a no-op while phase === closing', () => {
    renderHook(() => useGlobalKeyboard());
    driveProjectToOpen('a');
    sceneStore.getState().close();
    // snapshot events count — close() during closing must not re-fire telemetry
    const before = (window as Window & { dataLayer?: unknown[] }).dataLayer?.length ?? 0;
    dispatchKey('Escape');
    const after = (window as Window & { dataLayer?: unknown[] }).dataLayer?.length ?? 0;
    expect(sceneStore.getState().phase).toBe('closing');
    expect(after).toBe(before);
  });

  it('non-Escape keys are no-ops even when the panel is open', () => {
    renderHook(() => useGlobalKeyboard());
    driveProjectToOpen('a');
    dispatchKey('Enter');
    dispatchKey('a');
    expect(sceneStore.getState().phase).toBe('open');
  });

  it('Escape is ignored when focus is inside an input', () => {
    renderHook(() => useGlobalKeyboard());
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();
    driveProjectToOpen('a');
    dispatchKey('Escape');
    expect(sceneStore.getState().phase).toBe('open');
  });

  it('detaches the listener on unmount', () => {
    const { unmount } = renderHook(() => useGlobalKeyboard());
    driveProjectToOpen('a');
    unmount();
    dispatchKey('Escape');
    expect(sceneStore.getState().phase).toBe('open');
  });
});
