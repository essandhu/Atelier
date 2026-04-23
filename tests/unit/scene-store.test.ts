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

  it('open(project) enters docking (dockable kind) and fires panel.opened', () => {
    vi.spyOn(performance, 'now').mockReturnValue(1000);
    sceneStore.getState().open({ kind: 'project', id: 'atlas' });
    const s = sceneStore.getState();
    // Dockable kinds route to `docking` first (§4.3).
    expect(s.phase).toBe('docking');
    expect(s.activePanel).toEqual({ kind: 'project', id: 'atlas' });
    expect(s.openedAt).toBe(1000);
    const events = readDataLayer();
    expect(events).toContainEqual({
      name: 'panel.opened',
      panelId: 'project:atlas',
    });
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
    sceneStore.getState().settleDock();
    sceneStore.getState().startOpening();
    sceneStore.getState().markOpened();
    expect(sceneStore.getState().phase).toBe('open');
  });

  it('close() from open moves → closing and emits panel.closed with dwellMs', () => {
    const now = vi.spyOn(performance, 'now');
    now.mockReturnValueOnce(1000); // open()
    sceneStore.getState().open({ kind: 'project', id: 'atlas' });
    sceneStore.getState().settleDock();
    sceneStore.getState().startOpening();
    sceneStore.getState().markOpened();
    now.mockReturnValueOnce(1750); // close()
    sceneStore.getState().close();
    expect(sceneStore.getState().phase).toBe('closing');
    const events = readDataLayer();
    expect(events).toContainEqual({
      name: 'panel.closed',
      panelId: 'project:atlas',
      dwellMs: 750,
    });
  });

  it('close() is a no-op when already closing or closed', () => {
    sceneStore.getState().close();
    expect(sceneStore.getState().phase).toBe('closed');
    sceneStore.getState().open({ kind: 'project', id: 'a' });
    sceneStore.getState().settleDock();
    sceneStore.getState().startOpening();
    sceneStore.getState().markOpened();
    sceneStore.getState().close();
    const before = readDataLayer().length;
    sceneStore.getState().close();
    expect(readDataLayer().length).toBe(before);
  });

  it('markClosed() clears activePanel + openedAt and moves closing → closed', () => {
    sceneStore.getState().open({ kind: 'project', id: 'atlas' });
    sceneStore.getState().settleDock();
    sceneStore.getState().startOpening();
    sceneStore.getState().markOpened();
    sceneStore.getState().close();
    sceneStore.getState().markClosed();
    const s = sceneStore.getState();
    expect(s.phase).toBe('closed');
    expect(s.activePanel).toBeNull();
    expect(s.openedAt).toBeNull();
  });

  it('fires panel.opened / panel.closed for the skills panel', () => {
    const now = vi.spyOn(performance, 'now');
    now.mockReturnValueOnce(2000);
    sceneStore.getState().open({ kind: 'skills' });
    expect(readDataLayer()).toContainEqual({
      name: 'panel.opened',
      panelId: 'skills',
    });
    sceneStore.getState().settleDock();
    sceneStore.getState().startOpening();
    sceneStore.getState().markOpened();
    now.mockReturnValueOnce(2400);
    sceneStore.getState().close();
    expect(readDataLayer()).toContainEqual({
      name: 'panel.closed',
      panelId: 'skills',
      dwellMs: 400,
    });
  });

  it('fires panel.opened / panel.closed for the globe panel', () => {
    const now = vi.spyOn(performance, 'now');
    now.mockReturnValueOnce(5000);
    sceneStore.getState().open({ kind: 'globe' });
    expect(readDataLayer()).toContainEqual({
      name: 'panel.opened',
      panelId: 'globe',
    });
    sceneStore.getState().markOpened();
    now.mockReturnValueOnce(5250);
    sceneStore.getState().close();
    expect(readDataLayer()).toContainEqual({
      name: 'panel.closed',
      panelId: 'globe',
      dwellMs: 250,
    });
  });

  it('setHovered() updates hoveredObject', () => {
    sceneStore.getState().setHovered('atlas');
    expect(sceneStore.getState().hoveredObject).toBe('atlas');
    sceneStore.getState().setHovered(null);
    expect(sceneStore.getState().hoveredObject).toBeNull();
  });

  // --- P10-04: docking/docked phases + contact panel kind ---

  describe('dockable panels (project / skills / contact)', () => {
    it('open(project) routes through docking → docked → opening → open', () => {
      const now = vi.spyOn(performance, 'now');
      now.mockReturnValueOnce(1000);
      sceneStore.getState().open({ kind: 'project', id: 'atlas' });
      expect(sceneStore.getState().phase).toBe('docking');
      expect(sceneStore.getState().activePanel).toEqual({
        kind: 'project',
        id: 'atlas',
      });
      expect(sceneStore.getState().openedAt).toBe(1000);
      expect(readDataLayer()).toContainEqual({
        name: 'panel.opened',
        panelId: 'project:atlas',
      });

      sceneStore.getState().settleDock();
      expect(sceneStore.getState().phase).toBe('docked');

      sceneStore.getState().startOpening();
      expect(sceneStore.getState().phase).toBe('opening');

      sceneStore.getState().markOpened();
      expect(sceneStore.getState().phase).toBe('open');
    });

    it('open(skills) also routes through the dockable path', () => {
      sceneStore.getState().open({ kind: 'skills' });
      expect(sceneStore.getState().phase).toBe('docking');
      sceneStore.getState().settleDock();
      expect(sceneStore.getState().phase).toBe('docked');
    });

    it('open(contact) also routes through the dockable path', () => {
      sceneStore.getState().open({ kind: 'contact' });
      expect(sceneStore.getState().phase).toBe('docking');
      expect(sceneStore.getState().activePanel).toEqual({ kind: 'contact' });
      expect(readDataLayer()).toContainEqual({
        name: 'panel.opened',
        panelId: 'contact',
      });
    });

    it('close() from docking moves to closing → closed and emits panel.closed', () => {
      const now = vi.spyOn(performance, 'now');
      now.mockReturnValueOnce(1000); // open()
      sceneStore.getState().open({ kind: 'project', id: 'atlas' });
      expect(sceneStore.getState().phase).toBe('docking');
      now.mockReturnValueOnce(1250); // close()
      sceneStore.getState().close();
      expect(sceneStore.getState().phase).toBe('closing');
      expect(readDataLayer()).toContainEqual({
        name: 'panel.closed',
        panelId: 'project:atlas',
        dwellMs: 250,
      });
      sceneStore.getState().markClosed();
      expect(sceneStore.getState().phase).toBe('closed');
      expect(sceneStore.getState().activePanel).toBeNull();
      expect(sceneStore.getState().openedAt).toBeNull();
    });

    it('close() from docked moves to closing → closed and emits panel.closed', () => {
      const now = vi.spyOn(performance, 'now');
      now.mockReturnValueOnce(2000); // open()
      sceneStore.getState().open({ kind: 'skills' });
      sceneStore.getState().settleDock();
      expect(sceneStore.getState().phase).toBe('docked');
      now.mockReturnValueOnce(2500); // close()
      sceneStore.getState().close();
      expect(sceneStore.getState().phase).toBe('closing');
      expect(readDataLayer()).toContainEqual({
        name: 'panel.closed',
        panelId: 'skills',
        dwellMs: 500,
      });
      sceneStore.getState().markClosed();
      expect(sceneStore.getState().phase).toBe('closed');
    });

    it('settleDock() is a no-op outside docking phase', () => {
      sceneStore.getState().settleDock();
      expect(sceneStore.getState().phase).toBe('closed');

      sceneStore.getState().open({ kind: 'globe' }); // non-dockable → opening
      sceneStore.getState().settleDock();
      expect(sceneStore.getState().phase).toBe('opening');
    });

    it('startOpening() is a no-op outside docked phase', () => {
      sceneStore.getState().startOpening();
      expect(sceneStore.getState().phase).toBe('closed');

      sceneStore.getState().open({ kind: 'project', id: 'a' });
      // Still in docking — startOpening should not advance
      sceneStore.getState().startOpening();
      expect(sceneStore.getState().phase).toBe('docking');
    });
  });

  describe('non-dockable panels (globe / events) preserve the short path', () => {
    it('open(globe) goes closed → opening directly', () => {
      sceneStore.getState().open({ kind: 'globe' });
      expect(sceneStore.getState().phase).toBe('opening');
      sceneStore.getState().markOpened();
      expect(sceneStore.getState().phase).toBe('open');
    });

    it('open(events) goes closed → opening directly', () => {
      sceneStore.getState().open({ kind: 'events' });
      expect(sceneStore.getState().phase).toBe('opening');
      expect(readDataLayer()).toContainEqual({
        name: 'panel.opened',
        panelId: 'events',
      });
      sceneStore.getState().markOpened();
      expect(sceneStore.getState().phase).toBe('open');
    });
  });

  describe('at-most-one-open invariant', () => {
    it.each(['docking', 'docked', 'opening', 'open', 'closing'] as const)(
      'rejects open() while phase is %s',
      (targetPhase) => {
        sceneStore.getState().open({ kind: 'project', id: 'a' });
        if (targetPhase === 'docking') {
          // already here
        } else if (targetPhase === 'docked') {
          sceneStore.getState().settleDock();
        } else if (targetPhase === 'opening') {
          sceneStore.getState().settleDock();
          sceneStore.getState().startOpening();
        } else if (targetPhase === 'open') {
          sceneStore.getState().settleDock();
          sceneStore.getState().startOpening();
          sceneStore.getState().markOpened();
        } else if (targetPhase === 'closing') {
          sceneStore.getState().settleDock();
          sceneStore.getState().startOpening();
          sceneStore.getState().markOpened();
          sceneStore.getState().close();
        }
        expect(sceneStore.getState().phase).toBe(targetPhase);

        const beforeOpens = readDataLayer().filter(
          (e) => e.name === 'panel.opened',
        ).length;
        sceneStore.getState().open({ kind: 'project', id: 'b' });
        expect(sceneStore.getState().activePanel).toEqual({
          kind: 'project',
          id: 'a',
        });
        expect(
          readDataLayer().filter((e) => e.name === 'panel.opened').length,
        ).toBe(beforeOpens);
      },
    );
  });

  describe('panelIdOf', () => {
    it('returns "contact" for the contact kind', async () => {
      const { panelIdOf } = await import('@/store/scene-store');
      expect(panelIdOf({ kind: 'contact' })).toBe('contact');
    });
  });
});
