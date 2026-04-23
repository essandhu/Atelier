import type {
  ActivityEvent,
  ActivityStats,
  ContributionDay,
  GithubSnapshot,
  RepositoryNode,
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

// Extracts the {topRepo, publicRepos} summary from a raw UserActivityResponse.
// Kept separate from `toActivityEvents` so `fetchGithubSnapshot` can populate
// the snapshot without re-walking repositories.nodes. Ties on stargazerCount
// fall to the first node in document order (stable pick).
export const selectTopRepo = (
  resp: UserActivityResponse,
): { nameWithOwner: string; stars: number } | null => {
  const nodes: RepositoryNode[] = resp.user?.repositories.nodes ?? [];
  if (nodes.length === 0) return null;
  let best = nodes[0];
  for (let i = 1; i < nodes.length; i += 1) {
    if (nodes[i].stargazerCount > best.stargazerCount) {
      best = nodes[i];
    }
  }
  return { nameWithOwner: best.nameWithOwner, stars: best.stargazerCount };
};

export const selectPublicRepoCount = (
  resp: UserActivityResponse,
): number => resp.user?.repositories.totalCount ?? 0;

// Pure transform (architecture §5.3). Computed entirely from a
// GithubSnapshot — no network I/O, no clock reads, no Date.now(). The
// "today" anchor for `currentStreakDays` is the last entry in
// `snapshot.contributions` (ascending by date, gap-filled upstream).
export const deriveActivityStats = (
  snapshot: GithubSnapshot,
): ActivityStats => {
  const days = snapshot.contributions;

  let commits90d = 0;
  for (const d of days) commits90d += d.count;

  const prsMerged90d = snapshot.events.filter(
    (e) => e.kind === 'pr_merged',
  ).length;

  // Trailing non-zero run anchored at the most recent day.
  let currentStreakDays = 0;
  for (let i = days.length - 1; i >= 0; i -= 1) {
    if (days[i].count > 0) currentStreakDays += 1;
    else break;
  }

  // Longest contiguous non-zero run anywhere in the window.
  let longestStreakDays = 0;
  let run = 0;
  for (const d of days) {
    if (d.count > 0) {
      run += 1;
      if (run > longestStreakDays) longestStreakDays = run;
    } else {
      run = 0;
    }
  }

  return {
    commits90d,
    prsMerged90d,
    currentStreakDays,
    longestStreakDays,
    topRepo: snapshot.topRepo,
    publicRepos: snapshot.publicRepos,
  };
};
