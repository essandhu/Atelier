import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { retryFetch } from '@/data/github/retry';

const ok = (body: unknown = { ok: true }): Response =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });

const fail = (status: number): Response =>
  new Response(JSON.stringify({ error: 'nope' }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

describe('retryFetch', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('resolves immediately on a first-attempt 200', async () => {
    const stub = vi.fn<() => Promise<Response>>().mockResolvedValueOnce(ok());
    const promise = retryFetch(stub, { tag: 'test' });
    await vi.runAllTimersAsync();
    const res = await promise;
    expect(res.status).toBe(200);
    expect(stub).toHaveBeenCalledTimes(1);
  });

  it('succeeds on the third attempt after two 500s', async () => {
    const stub = vi
      .fn<() => Promise<Response>>()
      .mockResolvedValueOnce(fail(500))
      .mockResolvedValueOnce(fail(500))
      .mockResolvedValueOnce(ok());
    const promise = retryFetch(stub, { tag: 'test' });
    await vi.runAllTimersAsync();
    const res = await promise;
    expect(res.status).toBe(200);
    expect(stub).toHaveBeenCalledTimes(3);
  });

  it('gives up after 3 attempts when every attempt is 500', async () => {
    const stub = vi
      .fn<() => Promise<Response>>()
      .mockResolvedValue(fail(500));
    const promise = retryFetch(stub, { tag: 'test' });
    await vi.runAllTimersAsync();
    const res = await promise;
    expect(res.status).toBe(500);
    expect(stub).toHaveBeenCalledTimes(3);
  });

  it('does not retry on a 403', async () => {
    const stub = vi
      .fn<() => Promise<Response>>()
      .mockResolvedValue(fail(403));
    const promise = retryFetch(stub, { tag: 'test' });
    await vi.runAllTimersAsync();
    const res = await promise;
    expect(res.status).toBe(403);
    expect(stub).toHaveBeenCalledTimes(1);
  });

  it('retries on a 429', async () => {
    const stub = vi
      .fn<() => Promise<Response>>()
      .mockResolvedValueOnce(fail(429))
      .mockResolvedValueOnce(ok());
    const promise = retryFetch(stub, { tag: 'test' });
    await vi.runAllTimersAsync();
    const res = await promise;
    expect(res.status).toBe(200);
    expect(stub).toHaveBeenCalledTimes(2);
  });

  it('retries on network failure (thrown) and eventually succeeds', async () => {
    const stub = vi
      .fn<() => Promise<Response>>()
      .mockRejectedValueOnce(new Error('ECONNRESET'))
      .mockResolvedValueOnce(ok());
    const promise = retryFetch(stub, { tag: 'test' });
    await vi.runAllTimersAsync();
    const res = await promise;
    expect(res.status).toBe(200);
    expect(stub).toHaveBeenCalledTimes(2);
  });
});
