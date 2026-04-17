import 'server-only';

import { headers } from 'next/headers';
import { revalidateTag } from 'next/cache';
import { env } from '@/lib/env';
import { withReqId } from '@/lib/logger';
import {
  GITHUB_ACTIVITY_TAG,
  REVALIDATE_TAG_ALLOWLIST,
  type RevalidateTag,
} from '@/data/github/cache';

const isAllowedTag = (tag: string): tag is RevalidateTag =>
  (REVALIDATE_TAG_ALLOWLIST as readonly string[]).includes(tag);

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

export const POST = async (request: Request): Promise<Response> => {
  const headerList = await headers();
  const reqId = headerList.get('x-vercel-id') ?? newReqId();
  const log = withReqId(reqId);

  let payload: { secret?: unknown; tag?: unknown } = {};
  try {
    payload = (await request.json()) as typeof payload;
  } catch {
    return Response.json({ error: 'invalid json' }, { status: 400 });
  }

  if (typeof payload.secret !== 'string' || payload.secret !== env.REVALIDATE_SECRET) {
    log.warn('revalidate.unauthorized');
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }

  const tag =
    typeof payload.tag === 'string' && payload.tag.length > 0
      ? payload.tag
      : GITHUB_ACTIVITY_TAG;

  if (!isAllowedTag(tag)) {
    log.warn({ tag }, 'revalidate.tag_not_allowlisted');
    return Response.json({ error: 'tag not allowlisted' }, { status: 400 });
  }

  revalidateTag(tag);
  log.info({ tag }, 'revalidate.ok');
  return Response.json({ revalidated: true, tag });
};
