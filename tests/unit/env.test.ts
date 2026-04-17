import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const validEnv = {
  GITHUB_PAT: 'ghp_test',
  GITHUB_USERNAME: 'octocat',
  REVALIDATE_SECRET: 'revalidate-secret',
  NEXT_PUBLIC_SENTRY_DSN: 'https://public@sentry.example.com/1',
  LOG_LEVEL: 'info',
  VERCEL_ENV: 'development',
};

const loadEnv = async () => {
  vi.resetModules();
  return import('@/lib/env');
};

const originalEnv = { ...process.env };

describe('env', () => {
  beforeEach(() => {
    process.env = { ...originalEnv, ...validEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.resetModules();
  });

  it('parses a valid environment', async () => {
    const { env } = await loadEnv();
    expect(env.GITHUB_PAT).toBe('ghp_test');
    expect(env.GITHUB_USERNAME).toBe('octocat');
    expect(env.REVALIDATE_SECRET).toBe('revalidate-secret');
    expect(env.LOG_LEVEL).toBe('info');
    expect(env.VERCEL_ENV).toBe('development');
  });

  it('throws when a required key is missing', async () => {
    delete process.env.GITHUB_PAT;
    await expect(loadEnv()).rejects.toThrow(/GITHUB_PAT/);
  });

  it('throws when LOG_LEVEL is invalid', async () => {
    process.env.LOG_LEVEL = 'shouty';
    await expect(loadEnv()).rejects.toThrow(/LOG_LEVEL/);
  });

  it('defaults LOG_LEVEL to info when unset', async () => {
    delete process.env.LOG_LEVEL;
    const { env } = await loadEnv();
    expect(env.LOG_LEVEL).toBe('info');
  });

  it('exposes a client env with only NEXT_PUBLIC_* keys', async () => {
    const { clientEnv } = await loadEnv();
    expect(clientEnv.NEXT_PUBLIC_SENTRY_DSN).toBe('https://public@sentry.example.com/1');
    expect((clientEnv as Record<string, unknown>).GITHUB_PAT).toBeUndefined();
  });
});
