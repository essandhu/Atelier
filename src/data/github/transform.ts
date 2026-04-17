import type {
  ActivityEvent,
  ContributionDay,
  UserActivityResponse,
  UserContributionsResponse,
} from '@/data/github/types';

const DAY_MS = 24 * 60 * 60 * 1000;
const WINDOW_DAYS = 90;
const MAX_EVENTS = 30;

// Quartile-based binning. Copied verbatim from Section 5.3 of architecture.md.
export const quantize = (counts: number[]): (0 | 1 | 2 | 3 | 4)[] => {
  const nonZero = counts.filter((c) => c > 0).sort((a, b) => a - b);
  if (nonZero.length === 0) {
    return counts.map(() => 0);
  }
  const q = [
    nonZero[Math.floor(nonZero.length * 0.25)],
    nonZero[Math.floor(nonZero.length * 0.5)],
    nonZero[Math.floor(nonZero.length * 0.75)],
  ];
  return counts.map((c) => {
    if (c === 0) return 0;
    if (c <= q[0]) return 1;
    if (c <= q[1]) return 2;
    if (c <= q[2]) return 3;
    return 4;
  });
};

const isoDate = (ms: number): string => new Date(ms).toISOString().slice(0, 10);

const fillGaps = (
  days: Array<{ date: string; count: number }>,
): Array<{ date: string; count: number }> => {
  if (days.length === 0) return days;
  const sorted = [...days].sort((a, b) => (a.date < b.date ? -1 : 1));
  const result: Array<{ date: string; count: number }> = [];
  let cursorMs = Date.parse(sorted[0].date);
  const endMs = Date.parse(sorted[sorted.length - 1].date);
  const byDate = new Map(sorted.map((d) => [d.date, d.count]));
  while (cursorMs <= endMs) {
    const date = isoDate(cursorMs);
    result.push({ date, count: byDate.get(date) ?? 0 });
    cursorMs += DAY_MS;
  }
  return result;
};

export const toContributionDays = (
  resp: UserContributionsResponse,
): ContributionDay[] => {
  const weeks = resp.user?.contributionsCollection.contributionCalendar.weeks ?? [];
  const flat = weeks.flatMap((week) =>
    week.contributionDays.map((d) => ({
      date: d.date,
      count: d.contributionCount,
    })),
  );
  const filled = fillGaps(flat);
  const trimmed = filled.slice(-WINDOW_DAYS);
  const counts = trimmed.map((d) => d.count);
  const levels = quantize(counts);
  return trimmed.map((d, i) => ({
    date: d.date,
    count: d.count,
    level: levels[i],
  }));
};

const releaseTitle = (
  release: { name: string | null; tagName: string },
): string => release.name ?? release.tagName;

export const toActivityEvents = (
  resp: UserActivityResponse,
): ActivityEvent[] => {
  const prs = (resp.user?.pullRequests.nodes ?? []).map<ActivityEvent>((pr) => {
    const merged = pr.state === 'MERGED' && pr.mergedAt;
    const at = merged ? pr.mergedAt! : pr.createdAt;
    const kind: ActivityEvent['kind'] = merged ? 'pr_merged' : 'pr_opened';
    return {
      id: `${kind}:${pr.repository.nameWithOwner}:${at}`,
      at,
      repo: pr.repository.nameWithOwner,
      kind,
      title: pr.title,
      url: pr.url,
    };
  });

  const issues = (resp.user?.issues.nodes ?? []).map<ActivityEvent>((issue) => ({
    id: `issue:${issue.repository.nameWithOwner}:${issue.createdAt}`,
    at: issue.createdAt,
    repo: issue.repository.nameWithOwner,
    kind: 'issue',
    title: issue.title,
    url: issue.url,
  }));

  const releases = (resp.user?.repositories.nodes ?? []).flatMap((repo) =>
    repo.releases.nodes.map<ActivityEvent>((release) => {
      const at = release.publishedAt ?? release.createdAt;
      return {
        id: `release:${repo.nameWithOwner}:${at}`,
        at,
        repo: repo.nameWithOwner,
        kind: 'release',
        title: releaseTitle(release),
        url: release.url,
      };
    }),
  );

  return [...prs, ...issues, ...releases]
    .sort((a, b) => (a.at < b.at ? 1 : -1))
    .slice(0, MAX_EVENTS);
};
