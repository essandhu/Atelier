import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { EventsFeedPanel } from '@/ui/panels/EventsFeedPanel';
import { sceneStore } from '@/store/scene-store';
import type { GithubSnapshot } from '@/data/github/types';

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
    activePanel: { kind: 'events' },
    hoveredObject: null,
    openedAt: 0,
  });
};

const snapshot = (overrides: Partial<GithubSnapshot> = {}): GithubSnapshot => ({
  fetchedAt: '2026-04-22T10:00:00.000Z',
  username: 'essandhu',
  contributions: [],
  events: [
    {
      id: 'evt-1',
      at: '2026-04-22T18:00:00.000Z',
      repo: 'essandhu/twitch-chat-lab',
      kind: 'pr_merged',
      title: 'feat(heatmap): axis labels and styled tooltip',
      url: 'https://github.com/essandhu/twitch-chat-lab/pull/123',
    },
    {
      id: 'evt-2',
      at: '2026-04-22T16:01:00.000Z',
      repo: 'essandhu/twitch-chat-lab',
      kind: 'commit',
      title: 'fix(heatmap): legend overlap',
      url: 'https://github.com/essandhu/twitch-chat-lab/commit/abc',
    },
  ],
  ...overrides,
});

describe('<EventsFeedPanel>', () => {
  afterEach(() => cleanup());

  it('renders the "Recent activity" heading', () => {
    openPanel();
    render(<EventsFeedPanel snapshot={snapshot()} onClose={() => {}} />);
    expect(
      screen.getByRole('heading', { level: 2, name: /recent activity/i }),
    ).toBeInTheDocument();
  });

  it('renders one row per event with a clickable github link', () => {
    openPanel();
    render(<EventsFeedPanel snapshot={snapshot()} onClose={() => {}} />);
    const list = screen.getByTestId('events-feed-panel-list');
    const rows = within(list).getAllByRole('listitem');
    expect(rows).toHaveLength(2);

    const links = within(list).getAllByRole('link');
    expect(links).toHaveLength(2);
    for (const link of links) {
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      expect(link.getAttribute('href')).toMatch(/^https:\/\/github\.com\//);
    }
  });

  it('shows a "new" badge for events present in newEventIds', () => {
    openPanel();
    render(
      <EventsFeedPanel
        snapshot={snapshot()}
        newEventIds={new Set(['evt-1'])}
        onClose={() => {}}
      />,
    );
    const badges = screen.getAllByLabelText('new');
    expect(badges).toHaveLength(1);
  });

  it('renders the empty-state copy when there are no events', () => {
    openPanel();
    render(
      <EventsFeedPanel
        snapshot={snapshot({ events: [] })}
        onClose={() => {}}
      />,
    );
    expect(screen.getByText(/no recent activity/i)).toBeInTheDocument();
    expect(screen.queryByTestId('events-feed-panel-list')).not.toBeInTheDocument();
  });

  it('handles a null snapshot without crashing', () => {
    openPanel();
    render(<EventsFeedPanel snapshot={null} onClose={() => {}} />);
    expect(screen.getByText(/no recent activity/i)).toBeInTheDocument();
  });

  it('clicking the close button fires onClose', () => {
    openPanel();
    const onClose = vi.fn();
    render(<EventsFeedPanel snapshot={snapshot()} onClose={onClose} />);
    screen.getByRole('button', { name: /close panel/i }).click();
    expect(onClose).toHaveBeenCalled();
  });
});
