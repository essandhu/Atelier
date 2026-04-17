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

  it('Escape calls close() while phase === opening', () => {
    renderHook(() => useGlobalKeyboard());
    sceneStore.getState().open({ kind: 'project', id: 'a' });
    dispatchKey('Escape');
    expect(sceneStore.getState().phase).toBe('closing');
  });

  it('Escape calls close() while phase === open', () => {
    renderHook(() => useGlobalKeyboard());
    sceneStore.getState().open({ kind: 'project', id: 'a' });
    sceneStore.getState().markOpened();
    dispatchKey('Escape');
    expect(sceneStore.getState().phase).toBe('closing');
  });

  it('Escape is a no-op while phase === closing', () => {
    renderHook(() => useGlobalKeyboard());
    sceneStore.getState().open({ kind: 'project', id: 'a' });
    sceneStore.getState().markOpened();
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
    sceneStore.getState().open({ kind: 'project', id: 'a' });
    sceneStore.getState().markOpened();
    dispatchKey('Enter');
    dispatchKey('a');
    expect(sceneStore.getState().phase).toBe('open');
  });

  it('Escape is ignored when focus is inside an input', () => {
    renderHook(() => useGlobalKeyboard());
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();
    sceneStore.getState().open({ kind: 'project', id: 'a' });
    sceneStore.getState().markOpened();
    dispatchKey('Escape');
    expect(sceneStore.getState().phase).toBe('open');
  });

  it('detaches the listener on unmount', () => {
    const { unmount } = renderHook(() => useGlobalKeyboard());
    sceneStore.getState().open({ kind: 'project', id: 'a' });
    sceneStore.getState().markOpened();
    unmount();
    dispatchKey('Escape');
    expect(sceneStore.getState().phase).toBe('open');
  });
});
