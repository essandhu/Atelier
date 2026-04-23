import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, fireEvent, screen } from '@testing-library/react';
import {
  Pinboard,
  PINBOARD_PULSE_STORAGE_KEY,
  buildPinboardCards,
  hashActivityStats,
  resolvePulseKinds,
} from '@/scene/background/Pinboard';
import { sceneStore } from '@/store/scene-store';
import type { ActivityStats, ContributionDay } from '@/data/github/types';

// R3F + drei primitives have no meaning outside a <Canvas>; stub them to
// passthrough div/span so happy-dom can render the Pinboard's <Html>
// payload and assert on the DOM it emits. `primitive`-style elements from
// three (<mesh>, <group>, <planeGeometry>, etc.) get a generic fallback
// via the `r3f-intrinsic` mock below.
vi.mock('@react-three/drei', async () => {
  const actual =
    await vi.importActual<typeof import('@react-three/drei')>(
      '@react-three/drei',
    );
  return {
    ...actual,
    Html: ({
      children,
      ...rest
    }: {
      children: React.ReactNode;
      [key: string]: unknown;
    }) => {
      // Strip R3F-specific props so React doesn't warn about them on a
      // plain div.
      const { transform, occlude, center, zIndexRange, ...domProps } = rest as {
        transform?: unknown;
        occlude?: unknown;
        center?: unknown;
        zIndexRange?: unknown;
      };
      void transform;
      void occlude;
      void center;
      void zIndexRange;
      return <div {...domProps}>{children}</div>;
    },
  };
});

// Mock the ContributionGrid so the test doesn't have to instantiate Three
// materials (it exercises useFrame + useLayoutEffect on an InstancedMesh
// that has no meaning in happy-dom). A div stand-in preserves the
// contract: "heatmap child receives the quantized contribution payload".
vi.mock('@/scene/live-activity/ContributionGrid', () => ({
  ContributionGrid: ({
    contributions,
  }: {
    contributions: ContributionDay[];
  }) => (
    <div
      data-testid="contribution-grid-stub"
      data-count={contributions.length}
    />
  ),
  GRID_COLS: 13,
  GRID_CAPACITY: 91,
}));

const stats = (overrides: Partial<ActivityStats> = {}): ActivityStats => ({
  commits90d: 87,
  prsMerged90d: 12,
  currentStreakDays: 5,
  longestStreakDays: 21,
  topRepo: null,
  publicRepos: 14,
  ...overrides,
});

const contributions: ContributionDay[] = Array.from({ length: 90 }, (_, i) => ({
  date: `2026-0${1 + Math.floor(i / 30)}-${String((i % 30) + 1).padStart(2, '0')}`,
  count: i % 3,
  level: ((i % 3) as 0 | 1 | 2),
}));

// R3F registers its primitive elements (mesh, group, boxGeometry, …)
// inside an active <Canvas>. We render outside Canvas here — React
// therefore logs an "incorrect casing" warning for each primitive. They
// don't affect the assertions (we only read DOM emitted by mocked drei
// `<Html>` children), so we silence the warnings to keep the failure
// signal clean. Non-casing errors still surface.
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    const msg = typeof args[0] === 'string' ? args[0] : '';
    if (msg.includes('is using incorrect casing')) return;
    if (msg.includes('is unrecognized in this browser')) return;
    originalError.apply(console, args as Parameters<typeof console.error>);
  };
});
afterAll(() => {
  console.error = originalError;
});

beforeEach(() => {
  window.sessionStorage.clear();
  sceneStore.setState({
    phase: 'closed',
    activePanel: null,
    hoveredObject: null,
    openedAt: null,
  });
});

afterEach(() => {
  cleanup();
  window.sessionStorage.clear();
});

describe('buildPinboardCards', () => {
  it('produces exactly four cards in the documented kind order', () => {
    const cards = buildPinboardCards(stats());
    expect(cards.map((c) => c.kind)).toEqual([
      'commits',
      'streak',
      'prs',
      'heatmap',
    ]);
  });

  it('threads current and longest streak onto the streak card', () => {
    const [, streak] = buildPinboardCards(
      stats({ currentStreakDays: 5, longestStreakDays: 21 }),
    );
    expect(streak.kind).toBe('streak');
    expect(streak.value).toBe('5');
    expect(streak.subtitle).toMatch(/longest 21/i);
  });

  it('renders PRs and commits with plain integer strings', () => {
    const [commits, , prs] = buildPinboardCards(
      stats({ commits90d: 87, prsMerged90d: 12 }),
    );
    expect(commits.value).toBe('87');
    expect(prs.value).toBe('12');
  });

  it('gives each card a tooltip with the stat name + full value phrase', () => {
    const cards = buildPinboardCards(
      stats({ commits90d: 87, prsMerged90d: 12, currentStreakDays: 5 }),
    );
    expect(cards[0].tooltip).toBe('87 commits in 90 days');
    expect(cards[1].tooltip).toBe('5 day streak (longest 21)');
    expect(cards[2].tooltip).toBe('12 PRs merged in 90 days');
    expect(cards[3].tooltip).toMatch(/heatmap/i);
  });
});

describe('hashActivityStats', () => {
  it('is stable for equivalent stats', () => {
    expect(hashActivityStats(stats())).toBe(hashActivityStats(stats()));
  });

  it('changes when any numeric stat changes', () => {
    const base = hashActivityStats(stats({ commits90d: 87 }));
    const next = hashActivityStats(stats({ commits90d: 88 }));
    expect(next).not.toBe(base);
  });
});

describe('<Pinboard>', () => {
  it('renders all four card testids with server-rendered stats', () => {
    render(<Pinboard stats={stats()} contributions={contributions} />);
    expect(screen.getByTestId('pinboard-card-commits')).toBeInTheDocument();
    expect(screen.getByTestId('pinboard-card-streak')).toBeInTheDocument();
    expect(screen.getByTestId('pinboard-card-prs')).toBeInTheDocument();
    expect(screen.getByTestId('pinboard-card-heatmap')).toBeInTheDocument();
  });

  it('renders the primary number and label for each card', () => {
    render(
      <Pinboard
        stats={stats({ commits90d: 87, prsMerged90d: 12, currentStreakDays: 5 })}
        contributions={contributions}
      />,
    );
    const commits = screen.getByTestId('pinboard-card-commits');
    expect(commits.textContent).toContain('87');
    expect(commits.textContent?.toLowerCase()).toContain('commits');
    const prs = screen.getByTestId('pinboard-card-prs');
    expect(prs.textContent).toContain('12');
    const streak = screen.getByTestId('pinboard-card-streak');
    expect(streak.textContent).toContain('5');
    expect(streak.textContent?.toLowerCase()).toContain('longest 21');
  });

  it('forwards the snapshot contributions into ContributionGrid', () => {
    render(
      <Pinboard stats={stats()} contributions={contributions} />,
    );
    const grid = screen.getByTestId('contribution-grid-stub');
    expect(grid.getAttribute('data-count')).toBe(String(contributions.length));
  });

  it('marks changed cards with data-pulse=true on a return visit', () => {
    // Seed last-seen per-card hashes from a previous visit. Commits stat
    // moved 70 → 87 between sessions; streak + PRs + heatmap match the
    // current render. Using resolvePulseKinds to mint the prior hashes
    // keeps the test from duplicating the internal hash format.
    const previous = stats({
      commits90d: 70,
      prsMerged90d: 12,
      currentStreakDays: 5,
    });
    const seededStorage = {
      _backing: new Map<string, string>(),
      getItem(k: string): string | null {
        return this._backing.get(k) ?? null;
      },
      setItem(k: string, v: string): void {
        this._backing.set(k, v);
      },
    };
    // First call seeds the prior visit's hashes into the real storage.
    resolvePulseKinds(previous, seededStorage);
    window.sessionStorage.setItem(
      PINBOARD_PULSE_STORAGE_KEY,
      seededStorage._backing.get(PINBOARD_PULSE_STORAGE_KEY) ?? '{}',
    );

    render(
      <Pinboard
        stats={stats({ commits90d: 87 })}
        contributions={contributions}
      />,
    );
    const commits = screen.getByTestId('pinboard-card-commits');
    expect(commits.getAttribute('data-pulse')).toBe('true');
    const prs = screen.getByTestId('pinboard-card-prs');
    expect(prs.getAttribute('data-pulse')).toBe('false');
  });

  it('leaves all cards un-pulsed on the very first visit (no storage key)', () => {
    render(<Pinboard stats={stats()} contributions={contributions} />);
    for (const kind of ['commits', 'streak', 'prs', 'heatmap']) {
      expect(
        screen.getByTestId(`pinboard-card-${kind}`).getAttribute('data-pulse'),
      ).toBe('false');
    }
  });

  it('opens the events panel when the focus hotspot is activated via keyboard', () => {
    const openSpy = vi.spyOn(sceneStore.getState(), 'open');
    render(<Pinboard stats={stats()} contributions={contributions} />);
    const hotspot = screen.getByTestId('pinboard-hotspot');
    fireEvent.keyDown(hotspot, { key: 'Enter' });
    expect(openSpy).toHaveBeenCalledWith({ kind: 'events' });
  });

  it('registers the hotspot under TAB_ORDER.pinboard', () => {
    render(<Pinboard stats={stats()} contributions={contributions} />);
    const hotspot = screen.getByTestId('pinboard-hotspot');
    expect(hotspot.getAttribute('tabindex')).toBe('170');
    expect(hotspot.classList.contains('scene-focus-ring')).toBe(true);
  });
});
