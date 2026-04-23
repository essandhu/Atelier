import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import { LiveRegion } from '@/ui/a11y/LiveRegion';
import { sceneStore } from '@/store/scene-store';
import { fixtures } from '@/../tests/fixtures/projects';

const resetScene = (): void => {
  sceneStore.setState({
    phase: 'closed',
    activePanel: null,
    hoveredObject: null,
    openedAt: null,
  });
};

describe('<LiveRegion>', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetScene();
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
    resetScene();
  });

  it('announces the project title on opening', () => {
    render(<LiveRegion projects={[fixtures.public]} />);

    act(() => {
      sceneStore.setState({
        phase: 'opening',
        activePanel: { kind: 'project', id: fixtures.public.id },
        openedAt: 0,
      });
    });

    expect(screen.getByRole('status').textContent).toBe(
      `${fixtures.public.title} details opened`,
    );
  });

  it('announces the project title on closing (panel-specific)', () => {
    sceneStore.setState({
      phase: 'open',
      activePanel: { kind: 'project', id: fixtures.public.id },
      openedAt: 0,
    });
    render(<LiveRegion projects={[fixtures.public]} />);

    act(() => {
      sceneStore.setState({ phase: 'closing' });
    });

    expect(screen.getByRole('status').textContent).toBe(
      `${fixtures.public.title} details closed`,
    );
  });

  it('announces contact card close (panel-specific)', () => {
    sceneStore.setState({
      phase: 'open',
      activePanel: { kind: 'contact' },
      openedAt: 0,
    });
    render(<LiveRegion projects={[fixtures.public]} />);

    act(() => {
      sceneStore.setState({ phase: 'closing' });
    });

    expect(screen.getByRole('status').textContent).toBe('Contact closed');
  });

  it('clears the announcement after 1 second', () => {
    render(<LiveRegion projects={[fixtures.public]} />);

    act(() => {
      sceneStore.setState({
        phase: 'opening',
        activePanel: { kind: 'project', id: fixtures.public.id },
        openedAt: 0,
      });
    });
    expect(screen.getByRole('status').textContent).not.toBe('');

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByRole('status').textContent).toBe('');
  });
});
