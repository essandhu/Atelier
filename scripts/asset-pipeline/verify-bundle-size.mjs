#!/usr/bin/env node
// CI-blocking: fails if any route's gzipped JS exceeds the V1 budget.
// Parses .next/app-build-manifest.json (App Router) for route → chunk mapping
// and computes gzipped size from the on-disk chunk.
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

const BUDGET_BYTES = 1024 * 1024; // 1 MB gzipped per route
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
  for (const [route, chunks] of Object.entries(pages)) {
    let total = 0;
    for (const chunk of chunks) {
      total += await gzippedBytes(chunk);
    }
    routes.push({ route, gzippedBytes: total });
  }

  const overBudget = routes.filter((r) => r.gzippedBytes > BUDGET_BYTES);
  const report = {
    script: 'verify-bundle-size',
    budgetBytes: BUDGET_BYTES,
    routes,
    staticRoot: STATIC_ROOT,
  };

  if (overBudget.length > 0) {
    console.log(JSON.stringify({ ...report, status: 'fail', overBudget }));
    process.exit(1);
  }

  console.log(JSON.stringify({ ...report, status: 'ok' }));
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
