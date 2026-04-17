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
    repositories: { nodes: RepositoryNode[] };
  } | null;
}
