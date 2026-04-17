// Minimal exponential-backoff + jitter retry helper. Deliberate avoidance of
// cockatiel to keep the bundle footprint small — the policy here is tiny and
// fully exercised by the unit tests in `tests/unit/github-client-retry.test.ts`.
//
// Pure module: no imports from `@/lib/*` so it can be unit-tested without
// bringing up the env/logger chain. Callers inject a log callback.

export type RetryLog = (fields: Record<string, unknown>, msg: string) => void;

export interface RetryOptions {
  tag: string;
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  onRetry?: RetryLog;
}

const isRetriableStatus = (status: number): boolean =>
  status === 429 || status >= 500;

const backoffDelay = (
  attempt: number,
  base: number,
  cap: number,
): number => {
  const exp = Math.min(cap, base * 2 ** (attempt - 1));
  return Math.floor(Math.random() * exp);
};

const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const retryFetch = async (
  doFetch: () => Promise<Response>,
  options: RetryOptions,
): Promise<Response> => {
  const maxAttempts = options.maxAttempts ?? 3;
  const base = options.baseDelayMs ?? 200;
  const cap = options.maxDelayMs ?? 1000;
  const log = options.onRetry;

  let lastResponse: Response | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await doFetch();
      if (response.ok) return response;
      if (!isRetriableStatus(response.status)) return response;

      lastResponse = response;
      if (attempt < maxAttempts) {
        log?.(
          { attempt, status: response.status, tag: options.tag },
          'github.fetch.retry',
        );
        await wait(backoffDelay(attempt, base, cap));
      }
    } catch (err) {
      if (attempt >= maxAttempts) throw err;
      log?.({ attempt, err, tag: options.tag }, 'github.fetch.retry');
      await wait(backoffDelay(attempt, base, cap));
    }
  }

  if (lastResponse) return lastResponse;
  throw new Error('retryFetch: unreachable');
};
