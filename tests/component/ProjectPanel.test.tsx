import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { ProjectPanel } from '@/ui/panels/ProjectPanel';
import { sceneStore } from '@/store/scene-store';
import { fixtures } from '@/../tests/fixtures/projects';

// Radix Dialog renders its content inside a Portal gated on internal focus
// management that can race in happy-dom. Mock the Portal to render children
// inline so the DOM stays queryable and the Dialog renders without throwing
// on focus guard teardown.
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
    activePanel: { kind: 'project', id: fixtures.public.id },
    hoveredObject: null,
    openedAt: 0,
  });
};

describe('<ProjectPanel>', () => {
  afterEach(() => cleanup());

  it('renders the title as a heading', () => {
    openPanel();
    render(<ProjectPanel project={fixtures.public} onClose={() => {}} />);
    expect(
      screen.getByRole('heading', { name: fixtures.public.title }),
    ).toBeInTheDocument();
  });

  it('shows role / problem / approach / outcome text', () => {
    openPanel();
    render(<ProjectPanel project={fixtures.public} onClose={() => {}} />);
    expect(screen.getByText(fixtures.public.role)).toBeInTheDocument();
    expect(screen.getByText(fixtures.public.problem)).toBeInTheDocument();
    expect(screen.getByText(fixtures.public.approach)).toBeInTheDocument();
    expect(screen.getByText(fixtures.public.outcome)).toBeInTheDocument();
  });

  it('renders every stack chip', () => {
    openPanel();
    render(<ProjectPanel project={fixtures.public} onClose={() => {}} />);
    for (const s of fixtures.public.stack) {
      expect(screen.getByText(s)).toBeInTheDocument();
    }
  });

  it('renders external links with target=_blank and rel noopener noreferrer', () => {
    openPanel();
    render(<ProjectPanel project={fixtures.public} onClose={() => {}} />);
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThan(0);
    for (const a of links) {
      expect(a).toHaveAttribute('target', '_blank');
      const rel = a.getAttribute('rel') ?? '';
      expect(rel).toContain('noopener');
      expect(rel).toContain('noreferrer');
    }
  });

  it('exposes the data-testid for playwright', () => {
    openPanel();
    const { container } = render(
      <ProjectPanel project={fixtures.public} onClose={() => {}} />,
    );
    expect(
      container.querySelector(`[data-testid="project-panel-${fixtures.public.id}"]`),
    ).not.toBeNull();
  });

  it('clicking the close button fires onClose', async () => {
    openPanel();
    const onClose = vi.fn();
    render(<ProjectPanel project={fixtures.public} onClose={onClose} />);
    const btn = screen.getByRole('button', { name: /close panel/i });
    btn.click();
    expect(onClose).toHaveBeenCalled();
  });
});
