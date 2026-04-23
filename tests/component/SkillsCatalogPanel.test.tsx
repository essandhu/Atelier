import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { SkillsCatalogPanel } from '@/ui/panels/SkillsCatalogPanel';
import { sceneStore } from '@/store/scene-store';

vi.mock('radix-ui', async () => {
  const actual = await vi.importActual<typeof import('radix-ui')>('radix-ui');
  const PortalPassthrough = ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  );
  return {
    ...actual,
    Dialog: {
      ...actual.Dialog,
      Portal: PortalPassthrough,
    },
  };
});

const openPanel = (): void => {
  sceneStore.setState({
    phase: 'open',
    activePanel: { kind: 'skills' },
    hoveredObject: null,
    openedAt: 0,
  });
};

describe('<SkillsCatalogPanel>', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  it('renders a grouped heading for each populated category', () => {
    openPanel();
    render(<SkillsCatalogPanel onClose={() => {}} />);
    expect(
      screen.getByRole('heading', { name: /frontend/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /backend/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /tooling/i }),
    ).toBeInTheDocument();
  });

  it('clicking a project chip closes the current panel then opens the project', () => {
    openPanel();
    const openSpy = vi.spyOn(sceneStore.getState(), 'open');
    const closeSpy = vi.spyOn(sceneStore.getState(), 'close');
    render(<SkillsCatalogPanel onClose={() => {}} />);
    const chip = screen.getAllByRole('button', { name: /open .* details/i })[0];
    chip.click();
    expect(closeSpy).toHaveBeenCalled();

    // Post-P10-19 the chip handler subscribes to the store and waits for
    // `phase === 'closed'` before firing open(). Simulate PanelFrame's
    // markClosed that normally fires at durations.med; the subscription
    // callback then invokes open() synchronously.
    sceneStore.getState().markClosed();
    expect(openSpy).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'project' }),
    );
  });

  it('exposes data-testid for playwright', () => {
    openPanel();
    const { container } = render(<SkillsCatalogPanel onClose={() => {}} />);
    expect(
      container.querySelector('[data-testid="skills-catalog-panel"]'),
    ).not.toBeNull();
  });

  it('clicking the close button fires onClose', () => {
    openPanel();
    const onClose = vi.fn();
    render(<SkillsCatalogPanel onClose={onClose} />);
    screen.getByRole('button', { name: /close panel/i }).click();
    expect(onClose).toHaveBeenCalled();
  });
});
