import { describe, expect, it } from 'vitest';
import { deriveActivityStats } from '@/data/github/transform';
import type {
  ActivityEvent,
  ContributionDay,
  GithubSnapshot,
} from '@/data/github/types';

// Utility: build a 90-day contiguous contribution window ending on a given
// ISO date with a caller-supplied count-per-day function. Levels are filled
// with a harmless constant (quantize tiers aren't under test here).
const DAY_MS = 24 * 60 * 60 * 1000;
const buildDays = (
  endDate: string,
  len: number,
  countAt: (i: number) => number,
): ContributionDay[] => {
  const endMs = Date.parse(endDate + 'T00:00:00.000Z');
  const days: ContributionDay[] = [];
  for (let i = len - 1; i >= 0; i -= 1) {
    const iso = new Date(endMs - i * DAY_MS).toISOString().slice(0, 10);
    const count = countAt(len - 1 - i);
    days.push({ date: iso, count, level: count === 0 ? 0 : 2 });
  }
  return days;
};

const snapshot = (
  overrides: Partial<GithubSnapshot> = {},
): GithubSnapshot => ({
  fetchedAt: '2026-04-22T12:00:00.000Z',
  username: 'fixture-user',
  avatarUrl: 'https://github.com/fixture-user.png?size=460',
  contributions: [],
  events: [],
  topRepo: null,
  publicRepos: 0,
  ...overrides,
});

describe('deriveActivityStats', () => {
  it('returns all zeros on an empty / all-zero snapshot', () => {
    const zeroDays = buildDays('2026-04-22', 90, () => 0);
    const stats = deriveActivityStats(
      snapshot({ contributions: zeroDays, events: [] }),
    );

    expect(stats.commits90d).toBe(0);
    expect(stats.prsMerged90d).toBe(0);
    expect(stats.currentStreakDays).toBe(0);
    expect(stats.longestStreakDays).toBe(0);
    expect(stats.topRepo).toBeNull();
    expect(stats.publicRepos).toBe(0);
  });

  it('returns a full-window streak for 90 contiguous non-zero days', () => {
    const days = buildDays('2026-04-22', 90, () => 3);
    const stats = deriveActivityStats(
      snapshot({ contributions: days }),
    );

    expect(stats.commits90d).toBe(90 * 3);
    expect(stats.currentStreakDays).toBe(90);
    expect(stats.longestStreakDays).toBe(90);
  });

  it('tracks a trailing streak anchored on the most recent day when gaps exist', () => {
    // Structure: [20 non-zero] [10 zero] [5 non-zero] [5 zero] [50 non-zero]
    // Trailing 50 days are non-zero → currentStreak = 50.
    // Longest contiguous non-zero run = 50 (the trailing run itself).
    const plan = [
      ...Array(20).fill(2),
      ...Array(10).fill(0),
      ...Array(5).fill(4),
      ...Array(5).fill(0),
      ...Array(50).fill(1),
    ];
    const days = buildDays('2026-04-22', 90, (i) => plan[i]);
    const stats = deriveActivityStats(
      snapshot({ contributions: days }),
    );

    expect(stats.currentStreakDays).toBe(50);
    expect(stats.longestStreakDays).toBe(50);
    // commits90d = 20*2 + 5*4 + 50*1 = 40 + 20 + 50 = 110
    expect(stats.commits90d).toBe(110);
  });

  it('current streak is 0 when the most recent day has no contributions', () => {
    // Longest run pre-gap is 30, trailing 2 zeros kill the current streak.
    const plan = [
      ...Array(30).fill(5),
      ...Array(58).fill(1),
      0,
      0,
    ];
    const days = buildDays('2026-04-22', 90, (i) => plan[i]);
    const stats = deriveActivityStats(
      snapshot({ contributions: days }),
    );

    expect(stats.currentStreakDays).toBe(0);
    // Longest contiguous non-zero run spans days 0..87 (30 fives then 58 ones) = 88
    expect(stats.longestStreakDays).toBe(88);
  });

  it('counts only merged PRs toward prsMerged90d, ignoring commits/issues/releases', () => {
    const events: ActivityEvent[] = [
      {
        id: 'e1',
        at: '2026-04-21T00:00:00.000Z',
        repo: 'me/repo',
        kind: 'pr_merged',
        title: 'feat: a',
        url: 'https://example.test/1',
      },
      {
        id: 'e2',
        at: '2026-04-20T00:00:00.000Z',
        repo: 'me/repo',
        kind: 'pr_merged',
        title: 'feat: b',
        url: 'https://example.test/2',
      },
      {
        id: 'e3',
        at: '2026-04-19T00:00:00.000Z',
        repo: 'me/repo',
        kind: 'pr_opened',
        title: 'wip: c',
        url: 'https://example.test/3',
      },
      {
        id: 'e4',
        at: '2026-04-18T00:00:00.000Z',
        repo: 'me/repo',
        kind: 'issue',
        title: 'bug',
        url: 'https://example.test/4',
      },
      {
        id: 'e5',
        at: '2026-04-17T00:00:00.000Z',
        repo: 'me/repo',
        kind: 'release',
        title: 'v1',
        url: 'https://example.test/5',
      },
      {
        id: 'e6',
        at: '2026-04-16T00:00:00.000Z',
        repo: 'me/repo',
        kind: 'commit',
        title: 'chore',
        url: 'https://example.test/6',
      },
    ];
    const stats = deriveActivityStats(
      snapshot({
        contributions: buildDays('2026-04-22', 90, () => 0),
        events,
      }),
    );

    expect(stats.prsMerged90d).toBe(2);
    // commits90d derives from `contributions[*].count`, not events, so it is
    // 0 even though we have merged PRs present.
    expect(stats.commits90d).toBe(0);
  });

  it('picks the max-stargazer repo as topRepo and passes through publicRepos', () => {
    const stats = deriveActivityStats(
      snapshot({
        contributions: buildDays('2026-04-22', 90, () => 1),
        topRepo: { nameWithOwner: 'me/star', stars: 42 },
        publicRepos: 17,
      }),
    );

    expect(stats.topRepo).toEqual({ nameWithOwner: 'me/star', stars: 42 });
    expect(stats.publicRepos).toBe(17);
  });

  it('returns topRepo=null when the snapshot carries no repo info', () => {
    const stats = deriveActivityStats(
      snapshot({
        topRepo: null,
        publicRepos: 0,
      }),
    );
    expect(stats.topRepo).toBeNull();
  });
});
