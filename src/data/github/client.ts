import 'server-only';

import { env } from '@/lib/env';
import { logger } from '@/lib/logger';
import {
  GITHUB_ACTIVITY_TAG,
  githubFetchOptions,
} from '@/data/github/cache';
import { UserActivity, UserContributions } from '@/data/github/queries';
import { retryFetch } from '@/data/github/retry';
import {
  toActivityEvents,
  toContributionDays,
} from '@/data/github/transform';
import type {
  GithubSnapshot,
  UserActivityResponse,
  UserContributionsResponse,
} from '@/data/github/types';

const GITHUB_GRAPHQL = 'https://api.github.com/graphql';
const WINDOW_DAYS = 90;

export class GithubFetchError extends Error {
  readonly status: number;
  readonly reason: string;

  constructor(reason: string, status: number, cause?: unknown) {
    super(`GitHub fetch failed (${status}): ${reason}`);
    this.name = 'GithubFetchError';
    this.status = status;
    this.reason = reason;
    if (cause !== undefined) {
      (this as { cause?: unknown }).cause = cause;
    }
  }
}

interface GraphQLResult<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

const postGraphQL = async <T>(
  query: string,
  variables: Record<string, unknown>,
  tag: string,
): Promise<T> => {
  let response: Response;
  try {
    response = await retryFetch(
      () =>
        fetch(GITHUB_GRAPHQL, {
          method: 'POST',
          headers: {
            Authorization: `bearer ${env.GITHUB_PAT}`,
            'Content-Type': 'application/json',
            'User-Agent': 'atelier-portfolio',
          },
          body: JSON.stringify({ query, variables }),
          ...githubFetchOptions(tag),
        }),
      {
        tag,
        onRetry: (fields, msg) => logger.warn(fields, msg),
      },
    );
  } catch (err) {
    logger.error({ err, tag }, 'github.fetch.network_error');
    throw new GithubFetchError('network failure', 0, err);
  }

  if (!response.ok) {
    logger.error(
      { status: response.status, tag },
      'github.fetch.non_2xx',
    );
    throw new GithubFetchError(
      `non-2xx response`,
      response.status,
    );
  }

  const body = (await response.json()) as GraphQLResult<T>;
  if (body.errors && body.errors.length > 0) {
    const reason = body.errors.map((e) => e.message).join('; ');
    logger.error({ errors: body.errors, tag }, 'github.fetch.graphql_errors');
    throw new GithubFetchError(reason, response.status);
  }
  if (!body.data) {
    throw new GithubFetchError('empty response', response.status);
  }
  return body.data;
};

// Fixture loader — dynamic import so the JSON never ships in the production
// bundle. Gated by NEXT_PUBLIC_GITHUB_MODE in the caller (`app/page.tsx`).
export const loadFixtureSnapshot = async (): Promise<GithubSnapshot> => {
  const mod = await import('../../../tests/e2e/fixtures/github-mock.json');
  return (mod.default ?? mod) as unknown as GithubSnapshot;
};

export const fetchGithubSnapshot = async (
  username: string,
): Promise<GithubSnapshot> => {
  const to = new Date();
  const from = new Date(to.getTime() - WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const [contributions, activity] = await Promise.all([
    postGraphQL<UserContributionsResponse>(
      UserContributions,
      { login: username, from: from.toISOString(), to: to.toISOString() },
      GITHUB_ACTIVITY_TAG,
    ),
    postGraphQL<UserActivityResponse>(
      UserActivity,
      { login: username },
      GITHUB_ACTIVITY_TAG,
    ),
  ]);

  return {
    fetchedAt: new Date().toISOString(),
    username,
    contributions: toContributionDays(contributions),
    events: toActivityEvents(activity),
  };
};
