// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, renderHook } from '@testing-library/react';
import { sceneStore } from '@/store/scene-store';
import { useDockPhaseTimers } from '@/interaction/camera-dock/phase-timers';
import { durations } from '@/ui/motion/tokens';

const resetStore = (): void => {
  sceneStore.setState({
    phase: 'closed',
    activePanel: null,
    hoveredObject: null,
    openedAt: null,
  });
};

describe('useDockPhaseTimers', () => {
  beforeEach(() => {
    resetStore();
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('advances opening → open after durations.panel ms when shouldRun', () => {
    sceneStore.getState().open({ kind: 'project', id: 'a' });
    sceneStore.getState().settleDock();
    sceneStore.getState().startOpening();
    expect(sceneStore.getState().phase).toBe('opening');

    renderHook(({ shouldRun }) => useDockPhaseTimers(shouldRun), {
      initialProps: { shouldRun: true },
    });

    // Not yet — timer scheduled for `durations.panel`.
    vi.advanceTimersByTime(durations.panel - 1);
    expect(sceneStore.getState().phase).toBe('opening');

    vi.advanceTimersByTime(1);
    expect(sceneStore.getState().phase).toBe('open');
  });

  it('advances closing → closed after durations.med ms when shouldRun', () => {
    sceneStore.getState().open({ kind: 'project', id: 'a' });
    sceneStore.getState().settleDock();
    sceneStore.getState().startOpening();
    sceneStore.getState().markOpened();
    sceneStore.getState().close();
    expect(sceneStore.getState().phase).toBe('closing');

    renderHook(({ shouldRun }) => useDockPhaseTimers(shouldRun), {
      initialProps: { shouldRun: true },
    });

    vi.advanceTimersByTime(durations.med);
    expect(sceneStore.getState().phase).toBe('closed');
  });

  it('does not schedule timers when shouldRun is false', () => {
    sceneStore.getState().open({ kind: 'project', id: 'a' });
    sceneStore.getState().settleDock();
    sceneStore.getState().startOpening();

    renderHook(() => useDockPhaseTimers(false));

    vi.advanceTimersByTime(durations.panel * 2);
    expect(sceneStore.getState().phase).toBe('opening');
  });
});
