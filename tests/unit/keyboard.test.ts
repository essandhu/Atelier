// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useGlobalKeyboard } from '@/interaction/keyboard';
import { sceneStore } from '@/store/scene-store';
import { prefsStore } from '@/store/prefs-store';

interface DispatchOpts {
  shiftKey?: boolean;
}

const dispatchKey = (
  key: string,
  opts: DispatchOpts = {},
): KeyboardEvent => {
  const ev = new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
    shiftKey: opts.shiftKey ?? false,
  });
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
    prefsStore.setState({ presentationMode: 'auto' });
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

  // --- P10-08: Shift+Enter skip-dock + V presentation toggle ---

  describe('Shift+Enter on a dockable hotspot', () => {
    it("sets prefs.presentationMode = 'panel' then opens the panel", () => {
      renderHook(() => useGlobalKeyboard());
      // Simulate focus on a dockable hotspot.
      const btn = document.createElement('button');
      btn.setAttribute('data-dockable', 'true');
      btn.setAttribute('data-panel-kind', 'project');
      btn.setAttribute('data-panel-id', 'atlas');
      document.body.appendChild(btn);
      btn.focus();

      dispatchKey('Enter', { shiftKey: true });

      expect(prefsStore.getState().presentationMode).toBe('panel');
      expect(sceneStore.getState().activePanel).toEqual({
        kind: 'project',
        id: 'atlas',
      });
    });

    it('is a no-op when the focused element is not dockable', () => {
      renderHook(() => useGlobalKeyboard());
      const btn = document.createElement('button');
      document.body.appendChild(btn);
      btn.focus();

      dispatchKey('Enter', { shiftKey: true });

      expect(prefsStore.getState().presentationMode).toBe('auto');
      expect(sceneStore.getState().phase).toBe('closed');
    });

    it("reverts presentationMode to 'auto' when the panel closes", () => {
      renderHook(() => useGlobalKeyboard());
      const btn = document.createElement('button');
      btn.setAttribute('data-dockable', 'true');
      btn.setAttribute('data-panel-kind', 'skills');
      document.body.appendChild(btn);
      btn.focus();

      dispatchKey('Enter', { shiftKey: true });
      expect(prefsStore.getState().presentationMode).toBe('panel');

      // Drive to open, then close.
      sceneStore.getState().settleDock();
      sceneStore.getState().startOpening();
      sceneStore.getState().markOpened();
      sceneStore.getState().close();
      sceneStore.getState().markClosed();

      expect(prefsStore.getState().presentationMode).toBe('auto');
    });
  });

  describe('V toggles presentationMode while docked/open', () => {
    const driveProjectToOpen = (id: string): void => {
      sceneStore.getState().open({ kind: 'project', id });
      sceneStore.getState().settleDock();
      sceneStore.getState().startOpening();
      sceneStore.getState().markOpened();
    };

    it("cycles auto → diegetic → panel → auto (justification: novel → practical → default)", () => {
      renderHook(() => useGlobalKeyboard());
      driveProjectToOpen('a');
      expect(prefsStore.getState().presentationMode).toBe('auto');

      dispatchKey('v');
      expect(prefsStore.getState().presentationMode).toBe('diegetic');
      dispatchKey('v');
      expect(prefsStore.getState().presentationMode).toBe('panel');
      dispatchKey('v');
      expect(prefsStore.getState().presentationMode).toBe('auto');
    });

    it('also cycles from the docked phase (pre-open)', () => {
      renderHook(() => useGlobalKeyboard());
      sceneStore.getState().open({ kind: 'project', id: 'a' });
      sceneStore.getState().settleDock();
      expect(sceneStore.getState().phase).toBe('docked');
      dispatchKey('v');
      expect(prefsStore.getState().presentationMode).toBe('diegetic');
    });

    it('is a no-op while closed', () => {
      renderHook(() => useGlobalKeyboard());
      dispatchKey('v');
      expect(prefsStore.getState().presentationMode).toBe('auto');
    });

    it('is ignored when focus is inside an input (text-editing guard)', () => {
      renderHook(() => useGlobalKeyboard());
      driveProjectToOpen('a');
      const input = document.createElement('input');
      document.body.appendChild(input);
      input.focus();
      dispatchKey('v');
      expect(prefsStore.getState().presentationMode).toBe('auto');
    });
  });
});
