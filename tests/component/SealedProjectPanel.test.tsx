import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { SealedProjectPanel } from '@/ui/panels/SealedProjectPanel';
import { sceneStore } from '@/store/scene-store';
import { fixtures } from '@/../tests/fixtures/projects';

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

const openSealed = (): void => {
  sceneStore.setState({
    phase: 'open',
    activePanel: { kind: 'project', id: fixtures.nda.id },
    hoveredObject: null,
    openedAt: 0,
  });
};

describe('<SealedProjectPanel>', () => {
  afterEach(() => cleanup());

  it('does NOT leak NDA-restricted fields (problem)', () => {
    openSealed();
    render(<SealedProjectPanel project={fixtures.nda} onClose={() => {}} />);
    expect(screen.queryByText(fixtures.nda.problem)).not.toBeInTheDocument();
  });

  it('does NOT leak the approach text', () => {
    openSealed();
    render(<SealedProjectPanel project={fixtures.nda} onClose={() => {}} />);
    expect(screen.queryByText(fixtures.nda.approach)).not.toBeInTheDocument();
  });

  it('does NOT leak the outcome text', () => {
    openSealed();
    render(<SealedProjectPanel project={fixtures.nda} onClose={() => {}} />);
    expect(screen.queryByText(fixtures.nda.outcome)).not.toBeInTheDocument();
  });

  it('does NOT leak the summary', () => {
    openSealed();
    render(<SealedProjectPanel project={fixtures.nda} onClose={() => {}} />);
    expect(screen.queryByText(fixtures.nda.summary)).not.toBeInTheDocument();
  });

  it('shows the sealed treatment copy', () => {
    openSealed();
    render(<SealedProjectPanel project={fixtures.nda} onClose={() => {}} />);
    const matches = screen.getAllByText(/sealed/i);
    expect(matches.length).toBeGreaterThan(0);
  });

  it('shows the role (always disclosable)', () => {
    openSealed();
    render(<SealedProjectPanel project={fixtures.nda} onClose={() => {}} />);
    expect(screen.getByText(fixtures.nda.role)).toBeInTheDocument();
  });

  it('shows each stack entry', () => {
    openSealed();
    render(<SealedProjectPanel project={fixtures.nda} onClose={() => {}} />);
    for (const s of fixtures.nda.stack) {
      expect(screen.getByText(s)).toBeInTheDocument();
    }
  });

  it('clicking the close button fires onClose', () => {
    openSealed();
    const onClose = vi.fn();
    render(<SealedProjectPanel project={fixtures.nda} onClose={onClose} />);
    const btn = screen.getByRole('button', { name: /close panel/i });
    btn.click();
    expect(onClose).toHaveBeenCalled();
  });
});
