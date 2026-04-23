// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
  createPointerHandlers,
  usePointerMissed,
} from '@/interaction/pointer';
import { sceneStore } from '@/store/scene-store';

type StopEvent = { stopPropagation: () => void };

const resetStore = (): void => {
  sceneStore.setState({
    phase: 'closed',
    activePanel: null,
    hoveredObject: null,
    openedAt: null,
  });
};

const makeEvent = (): StopEvent => ({
  stopPropagation: vi.fn(),
});

describe('createPointerHandlers', () => {
  beforeEach(() => {
    resetStore();
    (window as Window & { dataLayer?: unknown[] }).dataLayer = [];
  });

  it('onPointerOver sets hoveredObject and stops propagation', () => {
    const handlers = createPointerHandlers('atlas');
    const ev = makeEvent();
    handlers.onPointerOver(ev as never);
    expect(sceneStore.getState().hoveredObject).toBe('atlas');
    expect(ev.stopPropagation).toHaveBeenCalled();
  });

  it('onPointerOut clears hoveredObject', () => {
    const handlers = createPointerHandlers('atlas');
    sceneStore.setState({ hoveredObject: 'atlas' });
    handlers.onPointerOut(makeEvent() as never);
    expect(sceneStore.getState().hoveredObject).toBeNull();
  });

  it('onClick (string id) dispatches open with a project panel payload', () => {
    const handlers = createPointerHandlers('atlas');
    handlers.onClick(makeEvent() as never);
    expect(sceneStore.getState().activePanel).toEqual({
      kind: 'project',
      id: 'atlas',
    });
    // Project is a dockable kind — entry phase is `docking` (§4.3).
    expect(sceneStore.getState().phase).toBe('docking');
  });

  it('second click while opening is rejected at store level (no re-entrant open)', () => {
    const h1 = createPointerHandlers('a');
    const h2 = createPointerHandlers('b');
    h1.onClick(makeEvent() as never);
    h2.onClick(makeEvent() as never);
    expect(sceneStore.getState().activePanel).toEqual({
      kind: 'project',
      id: 'a',
    });
  });

  it('overload: ActivePanel object opens that exact panel shape', () => {
    const handlers = createPointerHandlers({ kind: 'skills' });
    handlers.onClick(makeEvent() as never);
    expect(sceneStore.getState().activePanel).toEqual({ kind: 'skills' });
  });
});

describe('usePointerMissed', () => {
  beforeEach(() => resetStore());

  it('returns a handler that closes an open panel', () => {
    const { result } = renderHook(() => usePointerMissed());
    sceneStore.getState().open({ kind: 'project', id: 'a' });
    sceneStore.getState().settleDock();
    sceneStore.getState().startOpening();
    sceneStore.getState().markOpened();
    result.current();
    expect(sceneStore.getState().phase).toBe('closing');
  });

  it('is a no-op when no panel is open', () => {
    const { result } = renderHook(() => usePointerMissed());
    result.current();
    expect(sceneStore.getState().phase).toBe('closed');
  });
});
