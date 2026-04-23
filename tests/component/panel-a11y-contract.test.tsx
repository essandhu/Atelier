import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { ProjectPanel } from '@/ui/panels/ProjectPanel';
import { GlobePanel } from '@/ui/panels/GlobePanel';
import { SkillsCatalogPanel } from '@/ui/panels/SkillsCatalogPanel';
import { EventsFeedPanel } from '@/ui/panels/EventsFeedPanel';
import { sceneStore } from '@/store/scene-store';
import { fixtures } from '@/../tests/fixtures/projects';
import type { GithubSnapshot } from '@/data/github/types';

// Mirror of the mock used in each individual panel test file — renders the
// radix-ui Dialog Portal inline so the content is queryable in happy-dom.
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

const openProjectPanel = () => {
  sceneStore.setState({
    phase: 'open',
    activePanel: { kind: 'project', id: fixtures.public.id },
    hoveredObject: null,
    openedAt: 0,
  });
};

const openGlobePanel = () => {
  sceneStore.setState({
    phase: 'open',
    activePanel: { kind: 'globe' },
    hoveredObject: null,
    openedAt: 0,
  });
};

const openSkillsPanel = () => {
  sceneStore.setState({
    phase: 'open',
    activePanel: { kind: 'skills' },
    hoveredObject: null,
    openedAt: 0,
  });
};

const openEventsPanel = () => {
  sceneStore.setState({
    phase: 'open',
    activePanel: { kind: 'events' },
    hoveredObject: null,
    openedAt: 0,
  });
};

const eventsSnapshot: GithubSnapshot = {
  fetchedAt: '2026-04-22T10:00:00.000Z',
  username: 'essandhu',
  avatarUrl: 'https://github.com/essandhu.png?size=460',
  contributions: [],
  events: [
    {
      id: 'evt-a11y-1',
      at: '2026-04-22T18:00:00.000Z',
      repo: 'essandhu/twitch-chat-lab',
      kind: 'pr_merged',
      title: 'feat(heatmap): axis labels',
      url: 'https://github.com/essandhu/twitch-chat-lab/pull/1',
    },
  ],
};

// Collect ids from every rendered element so duplicate-id violations surface
// regardless of which element owns them. axe treats duplicate ids as a
// serious impact; the contract test catches them before the e2e axe run.
const collectIds = (container: HTMLElement): string[] => {
  const out: string[] = [];
  container.querySelectorAll('[id]').forEach((el) => {
    const id = el.getAttribute('id');
    if (id !== null && id !== '') out.push(id);
  });
  return out;
};

describe('Panel a11y contract parity', () => {
  afterEach(() => cleanup());

  describe.each([
    {
      label: '<ProjectPanel>',
      open: openProjectPanel,
      render: () => (
        <ProjectPanel project={fixtures.public} onClose={() => {}} />
      ),
    },
    {
      label: '<GlobePanel>',
      open: openGlobePanel,
      render: () => <GlobePanel onClose={() => {}} />,
    },
    {
      label: '<SkillsCatalogPanel>',
      open: openSkillsPanel,
      render: () => <SkillsCatalogPanel onClose={() => {}} />,
    },
    {
      label: '<EventsFeedPanel>',
      open: openEventsPanel,
      render: () => (
        <EventsFeedPanel snapshot={eventsSnapshot} onClose={() => {}} />
      ),
    },
  ])('$label', ({ open, render: renderPanel }) => {
    it('renders at least one heading with a non-empty accessible name', () => {
      open();
      const { container } = render(renderPanel());
      const frame = container.querySelector(
        '[data-testid="panel-frame"]',
      ) as HTMLElement | null;
      expect(frame).not.toBeNull();
      const headings = within(frame!).getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);
      const primary = headings[0];
      expect(primary.textContent?.trim().length ?? 0).toBeGreaterThan(0);
    });

    it('exposes a dialog role via radix Dialog', () => {
      open();
      render(renderPanel());
      // Radix DialogContent carries role="dialog"; happy-dom includes it in
      // the accessibility tree even with the mocked Portal.
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('has a close button with an accessible name containing "close"', () => {
      open();
      render(renderPanel());
      expect(
        screen.getByRole('button', { name: /close/i }),
      ).toBeInTheDocument();
    });

    it('renders without duplicate element ids (axe serious-impact guard)', () => {
      open();
      const { container } = render(renderPanel());
      const ids = collectIds(container);
      const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
      expect(duplicates).toEqual([]);
    });
  });
});
