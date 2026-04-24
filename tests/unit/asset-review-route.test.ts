// Asset-review route is dev-only. This test asserts the route module's
// production gate invokes notFound() when NODE_ENV === 'production'.
//
// The route itself renders a Three.js canvas which Vitest can't
// instantiate headlessly — we can't exercise the full render. But the
// gate is the safety-critical part (keeps the tool out of production
// bundles). Verifying it at the route function level is enough.

import { describe, expect, it, vi, afterEach } from 'vitest';

vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('__NEXT_NOT_FOUND__');
  },
}));

// The client component imports R3F / drei / three — those import ESM
// modules that can explode under jsdom. We stub it out for this gate test.
vi.mock('@/app/asset-review/AssetReviewClient', () => ({
  AssetReviewClient: () => null,
}));

describe('asset-review route — production gate', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('returns 404 in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const module = await import('@/app/asset-review/page');
    const page = module.default;
    await expect(
      page({ searchParams: Promise.resolve({}) }),
    ).rejects.toThrow('__NEXT_NOT_FOUND__');
  });

  // Note: a "renders in development" test would need jsx-dev-runtime
  // wired into the vitest env; the prod-gate check above is the only
  // load-bearing invariant (dev behaviour is exercised by the e2e test
  // at `tests/e2e/asset-review.spec.ts`).
});
