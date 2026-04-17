import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const IPHONE_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const DESKTOP_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const validEnv = {
  GITHUB_PAT: 'ghp_test',
  GITHUB_USERNAME: 'octocat',
  REVALIDATE_SECRET: 'revalidate-secret',
  LOG_LEVEL: 'info',
  VERCEL_ENV: 'development',
};

const originalEnv = { ...process.env };

const mockHeaders = (userAgent: string) => {
  vi.doMock('next/headers', () => ({
    headers: async () => ({
      get: (key: string) => {
        const k = key.toLowerCase();
        if (k === 'user-agent') return userAgent;
        if (k === 'x-vercel-id') return null;
        return null;
      },
    }),
  }));
};

const loadRoute = async () => {
  vi.resetModules();
  return import('@/app/api/health/route');
};

describe('GET /api/health', () => {
  beforeEach(() => {
    process.env = { ...originalEnv, ...validEnv };
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('{}', { status: 200 })),
    );
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.unstubAllGlobals();
    vi.resetModules();
    vi.doUnmock('next/headers');
  });

  it('returns mobile: true when the request UA is an iPhone', async () => {
    mockHeaders(IPHONE_UA);
    const { GET } = await loadRoute();
    const res = await GET();
    const body = (await res.json()) as {
      mobile: boolean;
      userAgent: string;
      ok: boolean;
      github: string;
    };
    expect(res.status).toBe(200);
    expect(body.mobile).toBe(true);
    expect(body.userAgent).toBe(IPHONE_UA);
    expect(body.ok).toBe(true);
    expect(body.github).toBe('reachable');
  });

  it('returns mobile: false for a desktop UA', async () => {
    mockHeaders(DESKTOP_UA);
    const { GET } = await loadRoute();
    const res = await GET();
    const body = (await res.json()) as { mobile: boolean; userAgent: string };
    expect(res.status).toBe(200);
    expect(body.mobile).toBe(false);
    expect(body.userAgent).toBe(DESKTOP_UA);
  });

  it('returns 503 with mobile flag preserved when GitHub probe fails', async () => {
    mockHeaders(IPHONE_UA);
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('{}', { status: 502 })),
    );
    const { GET } = await loadRoute();
    const res = await GET();
    const body = (await res.json()) as {
      mobile: boolean;
      ok: boolean;
      github: string;
    };
    expect(res.status).toBe(503);
    expect(body.ok).toBe(false);
    expect(body.github).toBe('unreachable');
    expect(body.mobile).toBe(true);
  });
});
