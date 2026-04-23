export interface ContributionDay {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface ActivityEvent {
  id: string;
  at: string;
  repo: string;
  kind: 'commit' | 'pr_opened' | 'pr_merged' | 'issue' | 'release';
  title: string;
  url: string;
}

export interface GithubSnapshot {
  fetchedAt: string;
  username: string;
  contributions: ContributionDay[];
  events: ActivityEvent[];
  // Stable redirect — https://github.com/{username}.png?size=460. Renders
  // on the square WallPiece (§5.11). The local public/scene/avatar.jpg
  // fetched at build/ISR time is the primary texture; this URL is the
  // runtime failover if the local JPEG is missing.
  avatarUrl: string;
}

// Derived stats displayed on the wall pinboard (§5.11). Computed by a
// pure transform from a GithubSnapshot — no additional network I/O.
export interface ActivityStats {
  commits90d: number;
  prsMerged90d: number;
  currentStreakDays: number;
  longestStreakDays: number;
  topRepo: { nameWithOwner: string; stars: number } | null;
  publicRepos: number;
}

export interface UserContributionsResponse {
  user: {
    contributionsCollection: {
      contributionCalendar: {
        weeks: Array<{
          contributionDays: Array<{
            date: string;
            contributionCount: number;
          }>;
        }>;
      };
    };
  } | null;
}

export interface PullRequestNode {
  id: string;
  title: string;
  url: string;
  state: 'OPEN' | 'MERGED' | 'CLOSED';
  createdAt: string;
  mergedAt: string | null;
  repository: { nameWithOwner: string };
}

export interface IssueNode {
  id: string;
  title: string;
  url: string;
  createdAt: string;
  repository: { nameWithOwner: string };
}

export interface ReleaseNode {
  id: string;
  name: string | null;
  tagName: string;
  url: string;
  publishedAt: string | null;
  createdAt: string;
}

export interface RepositoryNode {
  nameWithOwner: string;
  stargazerCount: number;
  releases: { nodes: ReleaseNode[] };
}

export interface UserActivityResponse {
  user: {
    pullRequests: { nodes: PullRequestNode[] };
    issues: { nodes: IssueNode[] };
    // `totalCount` reflects the public repo count for the owner; `nodes`
    // is capped by the paginated `first: N` request. `publicRepos` on
    // ActivityStats reads from `totalCount`, not `nodes.length`.
    repositories: { totalCount: number; nodes: RepositoryNode[] };
  } | null;
}
