import 'server-only';

import { headers } from 'next/headers';
import { env } from '@/lib/env';
import { withReqId } from '@/lib/logger';
import { isMobileUA } from '@/lib/viewport';
import {
  GITHUB_HEALTH_TAG,
  githubFetchOptions,
} from '@/data/github/cache';

const GITHUB_GRAPHQL = 'https://api.github.com/graphql';
const BUILT_AT = new Date().toISOString();

const newReqId = (): string => {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch {
    // fall through
  }
  return `req-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
};

const probeGithub = async (): Promise<boolean> => {
  const response = await fetch(GITHUB_GRAPHQL, {
    method: 'POST',
    headers: {
      Authorization: `bearer ${env.GITHUB_PAT}`,
      'Content-Type': 'application/json',
      'User-Agent': 'atelier-health',
    },
    body: JSON.stringify({ query: '{ viewer { login } }' }),
    ...githubFetchOptions(GITHUB_HEALTH_TAG, 60),
  });
  return response.ok;
};

export const GET = async (): Promise<Response> => {
  const headerList = await headers();
  const reqId = headerList.get('x-vercel-id') ?? newReqId();
  const userAgent = headerList.get('user-agent') ?? '';
  const mobile = isMobileUA(userAgent);
  const log = withReqId(reqId);
  const version = process.env.VERCEL_GIT_COMMIT_SHA ?? 'local';

  try {
    const reachable = await probeGithub();
    if (!reachable) {
      log.warn('health.github_unreachable');
      return Response.json(
        {
          ok: false,
          github: 'unreachable',
          mobile,
          userAgent,
          version,
          builtAt: BUILT_AT,
        },
        { status: 503 },
      );
    }
    return Response.json({
      ok: true,
      github: 'reachable',
      mobile,
      userAgent,
      version,
      builtAt: BUILT_AT,
    });
  } catch (err) {
    log.error({ err }, 'health.github_probe_error');
    return Response.json(
      {
        ok: false,
        github: 'unreachable',
        mobile,
        userAgent,
        version,
        builtAt: BUILT_AT,
      },
      { status: 503 },
    );
  }
};
