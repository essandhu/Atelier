// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { sceneStore } from '@/store/scene-store';
import type { Event } from '@/telemetry/events';

type TrackingWindow = Window & { dataLayer?: Event[] };

const resetStore = (): void => {
  sceneStore.setState({
    phase: 'closed',
    activePanel: null,
    hoveredObject: null,
    openedAt: null,
  });
};

const readDataLayer = (): Event[] => {
  if (typeof window === 'undefined') return [];
  const w = window as TrackingWindow;
  return w.dataLayer ?? [];
};

describe('scene-store', () => {
  beforeEach(() => {
    resetStore();
    if (typeof window !== 'undefined') {
      (window as TrackingWindow).dataLayer = [];
    }
    vi.restoreAllMocks();
  });

  it('starts in the closed phase with no active panel', () => {
    const s = sceneStore.getState();
    expect(s.phase).toBe('closed');
    expect(s.activePanel).toBeNull();
    expect(s.hoveredObject).toBeNull();
    expect(s.openedAt).toBeNull();
  });

  it('open() moves closed → opening and fires panel.opened for a project', () => {
    vi.spyOn(performance, 'now').mockReturnValue(1000);
    sceneStore.getState().open({ kind: 'project', id: 'atlas' });
    const s = sceneStore.getState();
    expect(s.phase).toBe('opening');
    expect(s.activePanel).toEqual({ kind: 'project', id: 'atlas' });
    expect(s.openedAt).toBe(1000);
    const events = readDataLayer();
    expect(events).toContainEqual({ name: 'panel.opened', projectId: 'atlas' });
  });

  it('open() is a no-op while already opening (rejects re-entrant opens)', () => {
    sceneStore.getState().open({ kind: 'project', id: 'a' });
    sceneStore.getState().open({ kind: 'project', id: 'b' });
    const s = sceneStore.getState();
    expect(s.activePanel).toEqual({ kind: 'project', id: 'a' });
    expect(readDataLayer().filter((e) => e.name === 'panel.opened')).toHaveLength(1);
  });

  it('markOpened() advances opening → open', () => {
    sceneStore.getState().open({ kind: 'project', id: 'a' });
    sceneStore.getState().markOpened();
    expect(sceneStore.getState().phase).toBe('open');
  });

  it('close() moves open → closing and emits panel.closed with dwellMs', () => {
    const now = vi.spyOn(performance, 'now');
    now.mockReturnValueOnce(1000); // open()
    sceneStore.getState().open({ kind: 'project', id: 'atlas' });
    sceneStore.getState().markOpened();
    now.mockReturnValueOnce(1750); // close()
    sceneStore.getState().close();
    expect(sceneStore.getState().phase).toBe('closing');
    const events = readDataLayer();
    expect(events).toContainEqual({
      name: 'panel.closed',
      projectId: 'atlas',
      dwellMs: 750,
    });
  });

  it('close() is a no-op when already closing or closed', () => {
    sceneStore.getState().close();
    expect(sceneStore.getState().phase).toBe('closed');
    sceneStore.getState().open({ kind: 'project', id: 'a' });
    sceneStore.getState().markOpened();
    sceneStore.getState().close();
    const before = readDataLayer().length;
    sceneStore.getState().close();
    expect(readDataLayer().length).toBe(before);
  });

  it('markClosed() clears activePanel + openedAt and moves closing → closed', () => {
    sceneStore.getState().open({ kind: 'project', id: 'atlas' });
    sceneStore.getState().markOpened();
    sceneStore.getState().close();
    sceneStore.getState().markClosed();
    const s = sceneStore.getState();
    expect(s.phase).toBe('closed');
    expect(s.activePanel).toBeNull();
    expect(s.openedAt).toBeNull();
  });

  it('does not fire panel.opened/closed for non-project panels', () => {
    sceneStore.getState().open({ kind: 'skills' });
    expect(readDataLayer().some((e) => e.name === 'panel.opened')).toBe(false);
    sceneStore.getState().markOpened();
    sceneStore.getState().close();
    expect(readDataLayer().some((e) => e.name === 'panel.closed')).toBe(false);
  });

  it('setHovered() updates hoveredObject', () => {
    sceneStore.getState().setHovered('atlas');
    expect(sceneStore.getState().hoveredObject).toBe('atlas');
    sceneStore.getState().setHovered(null);
    expect(sceneStore.getState().hoveredObject).toBeNull();
  });
});
