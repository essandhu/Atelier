// One-shot generator for tests/e2e/fixtures/github-mock.json.
// Run with: `node scripts/gen-github-fixture.mjs`.
// The fixture itself is checked in — regenerate only if the fixed schema shifts.

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '../tests/e2e/fixtures/github-mock.json');

const FETCHED_AT = '2026-04-01T12:00:00.000Z';
const USERNAME = 'atelier-fixture';
const DAY_MS = 24 * 60 * 60 * 1000;

const bucket = (level) => {
  if (level === 0) return 0;
  if (level === 1) return 1 + (level * 3) % 3;
  if (level === 2) return 5;
  if (level === 3) return 11;
  return 19;
};

// Deterministic level sequence (repeats to 90 entries).
// Pattern intentionally seeds multiple of each level so quantiles are hit.
const pattern = [0, 1, 2, 1, 0, 3, 2, 4, 1, 0, 2, 3, 1, 0, 4, 2, 1, 3];

const contributions = [];
const endDate = new Date('2026-04-01T00:00:00.000Z').getTime();
for (let i = 89; i >= 0; i--) {
  const level = pattern[(89 - i) % pattern.length];
  const date = new Date(endDate - i * DAY_MS).toISOString().slice(0, 10);
  contributions.push({ date, count: bucket(level), level });
}

// 14 events with strictly-decreasing `at` times, varied kinds.
const REPOS = [
  'octocat/hello-world',
  'octocat/spoon-knife',
  'octocat/atelier',
  'octocat/desk-runtime',
  'octocat/lightmaps',
];
const KIND_CYCLE = [
  'release',
  'pr_merged',
  'commit',
  'pr_opened',
  'issue',
  'pr_merged',
  'commit',
  'release',
  'issue',
  'pr_opened',
  'commit',
  'pr_merged',
  'commit',
  'issue',
];
const TITLES = {
  commit: 'refactor: tighten scene module boundaries',
  pr_opened: 'feat: draft live-activity book',
  pr_merged: 'feat: static evening scene composition',
  issue: 'tracking: bump R3F to the React-19 line',
  release: 'v0.3.0 — live activity book',
};
const events = KIND_CYCLE.map((kind, i) => {
  const at = new Date(new Date(FETCHED_AT).getTime() - i * 3 * 3600 * 1000).toISOString();
  const repo = REPOS[i % REPOS.length];
  const id = `evt-${i + 1}`;
  return {
    id,
    at,
    repo,
    kind,
    title: TITLES[kind],
    url: `https://github.com/${repo}/commit/${id}`,
  };
});

const snapshot = {
  fetchedAt: FETCHED_AT,
  username: USERNAME,
  contributions,
  events,
  avatarUrl: `https://github.com/${encodeURIComponent(USERNAME)}.png?size=460`,
};

writeFileSync(OUT, JSON.stringify(snapshot, null, 2) + '\n');
console.log(`Wrote ${OUT} (${contributions.length} days, ${events.length} events)`);
