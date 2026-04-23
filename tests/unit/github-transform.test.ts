import { describe, expect, it } from 'vitest';
import fixture from './fixtures/github-contributions.json';
import {
  quantize,
  toActivityEvents,
  toContributionDays,
} from '@/data/github/transform';
import type {
  UserActivityResponse,
  UserContributionsResponse,
} from '@/data/github/types';

// To regenerate the contributions fixture against the live API, set
// ATELIER_REFRESH_FIXTURES=1 and re-run Phase 3's fixture script.

describe('quantize', () => {
  it('returns all zeros when every count is zero', () => {
    expect(quantize([0, 0, 0, 0])).toEqual([0, 0, 0, 0]);
  });

  it('assigns quartile buckets from the non-zero distribution', () => {
    const result = quantize([0, 1, 2, 4, 8, 16, 32]);
    expect(result[0]).toBe(0);
    expect(result.at(-1)).toBe(4);
    // Max always maps to level 4; min non-zero never exceeds level 2.
    expect(Math.max(...result)).toBe(4);
  });

  it('levels only take values in {0,1,2,3,4}', () => {
    const result = quantize([0, 1, 2, 3, 4, 5, 6, 7, 8]);
    for (const level of result) {
      expect([0, 1, 2, 3, 4]).toContain(level);
    }
  });
});

describe('toContributionDays', () => {
  it('flattens weeks into an ascending date list and fills gaps with zero', () => {
    const resp = fixture.data as unknown as UserContributionsResponse;
    const days = toContributionDays(resp);

    // Check ascending order.
    for (let i = 1; i < days.length; i += 1) {
      expect(days[i - 1].date <= days[i].date).toBe(true);
    }

    // The fixture is missing 2026-01-07 between two real days; it should be
    // filled in with a zero-count entry.
    const jan7 = days.find((d) => d.date === '2026-01-07');
    expect(jan7).toBeDefined();
    expect(jan7?.count).toBe(0);
    expect(jan7?.level).toBe(0);
  });

  it('trims to at most 90 days', () => {
    const manyWeeks = Array.from({ length: 20 }, (_, w) => ({
      contributionDays: Array.from({ length: 7 }, (_, d) => ({
        date: new Date(Date.UTC(2026, 0, 1 + w * 7 + d))
          .toISOString()
          .slice(0, 10),
        contributionCount: 1,
      })),
    }));
    const resp: UserContributionsResponse = {
      user: {
        contributionsCollection: {
          contributionCalendar: { weeks: manyWeeks },
        },
      },
    };
    const days = toContributionDays(resp);
    expect(days.length).toBeLessThanOrEqual(90);
  });
});

describe('toActivityEvents', () => {
  it('merges PRs, issues, and releases into a stable, newest-first list', () => {
    const resp: UserActivityResponse = {
      user: {
        pullRequests: {
          nodes: [
            {
              id: 'pr1',
              title: 'Fix a bug',
              url: 'https://github.com/me/repo/pull/1',
              state: 'MERGED',
              createdAt: '2026-02-01T00:00:00Z',
              mergedAt: '2026-02-02T00:00:00Z',
              repository: { nameWithOwner: 'me/repo' },
            },
          ],
        },
        issues: {
          nodes: [
            {
              id: 'issue1',
              title: 'Something',
              url: 'https://github.com/me/repo/issues/3',
              createdAt: '2026-03-01T00:00:00Z',
              repository: { nameWithOwner: 'me/repo' },
            },
          ],
        },
        repositories: {
          totalCount: 1,
          nodes: [
            {
              nameWithOwner: 'me/repo',
              stargazerCount: 10,
              releases: {
                nodes: [
                  {
                    id: 'rel1',
                    name: 'v1.0',
                    tagName: 'v1.0',
                    url: 'https://github.com/me/repo/releases/tag/v1.0',
                    publishedAt: '2026-03-10T00:00:00Z',
                    createdAt: '2026-03-10T00:00:00Z',
                  },
                ],
              },
            },
          ],
        },
      },
    };

    const events = toActivityEvents(resp);
    expect(events.length).toBe(3);
    expect(events[0].kind).toBe('release'); // newest
    expect(events.every((e) => e.id.includes(':'))).toBe(true);
  });
});
