// Deterministic GithubSnapshot fixture.
//
// Source of truth: `github-mock.json` (90 ContributionDay entries spanning
// all five quantiles, 14 ActivityEvents with strictly-decreasing `at` times).
// The canonical `fetchedAt` is 2026-04-01T12:00:00.000Z — fixed so the fixture
// is deterministic under both Playwright (`NEXT_PUBLIC_GITHUB_MODE=fixture`)
// and the unit-test harness. Regenerate only via
// `node scripts/gen-github-fixture.mjs`.

import type { GithubSnapshot } from '@/data/github/types';
import raw from './github-mock.json';

export const GITHUB_MOCK_SNAPSHOT: GithubSnapshot = raw as GithubSnapshot;
