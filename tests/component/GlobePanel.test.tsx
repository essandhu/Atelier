import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { GlobePanel } from '@/ui/panels/GlobePanel';
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
    activePanel: { kind: 'globe' },
    hoveredObject: null,
    openedAt: 0,
  });
};

describe('<GlobePanel>', () => {
  afterEach(() => cleanup());

  it('shows the "Currently based in" heading', () => {
    openPanel();
    render(<GlobePanel onClose={() => {}} />);
    expect(screen.getByText(/currently based in/i)).toBeInTheDocument();
  });

  it('renders the profile location string', () => {
    openPanel();
    render(<GlobePanel onClose={() => {}} />);
    expect(screen.getByText(/texas/i)).toBeInTheDocument();
  });

  it('renders coordinates in DD.D°N/S, DD.D°E/W format', () => {
    openPanel();
    render(<GlobePanel onClose={() => {}} />);
    expect(screen.getByText(/31\.0°N, 100\.0°W/)).toBeInTheDocument();
  });

  it('exposes a data-testid for playwright', () => {
    openPanel();
    const { container } = render(<GlobePanel onClose={() => {}} />);
    expect(container.querySelector('[data-testid="globe-panel"]')).not.toBeNull();
  });

  it('clicking the close button fires onClose', () => {
    openPanel();
    const onClose = vi.fn();
    render(<GlobePanel onClose={onClose} />);
    screen.getByRole('button', { name: /close panel/i }).click();
    expect(onClose).toHaveBeenCalled();
  });
});
