#!/usr/bin/env node
// CI-blocking: fails if any route's gzipped JS exceeds the V1 budget.
// Parses .next/app-build-manifest.json (App Router) for route → chunk mapping
// and computes gzipped size from the on-disk chunk.
//
// Phase 8 additions:
//  - Soft 600 KB gate on the entry chunk for `/` (current is ~538 KB per Phase 7
//    evidence; +60 KB headroom for Phase 8 toggle copy + DeviceOrientation
//    listener). MediaPipe must never contribute — it is lazy-imported in
//    FaceTracker.tsx and MUST NOT land in the initial chunk.
//  - Explicit "no mediapipe in initial chunk" assertion: inspects the initial
//    `/` manifest entry and fails if any chunk filename contains 'mediapipe'
//    or 'tasks-vision'. The 1 MB hard ceiling stays as the catch-all.
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

const BUDGET_BYTES = 1024 * 1024; // 1 MB gzipped per route
const ROOT_ROUTE_SOFT_BYTES = 600 * 1024; // 600 KB soft gate for `/`
const FORBIDDEN_IN_INITIAL = ['mediapipe', 'tasks-vision'];
const BUILD_DIR = path.resolve(process.cwd(), '.next');
const MANIFEST_PATH = path.join(BUILD_DIR, 'app-build-manifest.json');
const STATIC_ROOT = path.join(BUILD_DIR, 'static');

const tryStat = async (p) => {
  try {
    return await stat(p);
  } catch {
    return null;
  }
};

const gzippedBytes = async (chunk) => {
  const full = path.join(BUILD_DIR, chunk);
  const info = await tryStat(full);
  if (!info) return 0;
  const buf = await readFile(full);
  return gzipSync(buf).length;
};

const main = async () => {
  const manifestInfo = await tryStat(MANIFEST_PATH);
  if (!manifestInfo) {
    console.log(
      JSON.stringify({
        script: 'verify-bundle-size',
        status: 'skip',
        reason: 'no .next build — run pnpm build first',
      }),
    );
    return;
  }

  const manifestRaw = await readFile(MANIFEST_PATH, 'utf8');
  const manifest = JSON.parse(manifestRaw);
  const pages = manifest.pages ?? {};

  const routes = [];
  const routeChunks = {};
  for (const [route, chunks] of Object.entries(pages)) {
    let total = 0;
    for (const chunk of chunks) {
      total += await gzippedBytes(chunk);
    }
    routes.push({ route, gzippedBytes: total });
    routeChunks[route] = chunks;
  }

  const overBudget = routes.filter((r) => r.gzippedBytes > BUDGET_BYTES);

  const rootChunks = routeChunks['/page'] ?? routeChunks['/'] ?? [];
  const forbiddenHits = rootChunks.filter((c) =>
    FORBIDDEN_IN_INITIAL.some((needle) => c.includes(needle)),
  );

  const rootRouteSize =
    routes.find((r) => r.route === '/page' || r.route === '/')?.gzippedBytes ??
    0;
  const rootOverSoft = rootRouteSize > ROOT_ROUTE_SOFT_BYTES;

  const report = {
    script: 'verify-bundle-size',
    budgetBytes: BUDGET_BYTES,
    rootSoftBudgetBytes: ROOT_ROUTE_SOFT_BYTES,
    rootRouteGzippedBytes: rootRouteSize,
    forbiddenInInitial: FORBIDDEN_IN_INITIAL,
    routes,
    staticRoot: STATIC_ROOT,
    mediapipeInInitialChunk: forbiddenHits.length > 0,
    mediapipeMatches: forbiddenHits,
  };

  if (forbiddenHits.length > 0) {
    console.log(
      JSON.stringify({
        ...report,
        status: 'fail',
        reason: 'mediapipe / tasks-vision present in initial chunk',
      }),
    );
    process.exit(1);
  }

  if (overBudget.length > 0) {
    console.log(JSON.stringify({ ...report, status: 'fail', overBudget }));
    process.exit(1);
  }

  if (rootOverSoft) {
    console.log(
      JSON.stringify({
        ...report,
        status: 'fail',
        reason: `root route exceeds soft 600 KB gate (${rootRouteSize} bytes)`,
      }),
    );
    process.exit(1);
  }

  console.log(JSON.stringify({ ...report, status: 'ok' }));
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
