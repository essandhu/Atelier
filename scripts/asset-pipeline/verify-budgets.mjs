#!/usr/bin/env node
// CI-blocking: fails if public/scene/ bytes plus one lightmap exceed 15MB.
import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const SCENE_ROOT = path.resolve(process.cwd(), 'public/scene');
const BUDGET_BYTES = 15 * 1024 * 1024;
const LIGHTMAP_RESERVE_BYTES = 2 * 1024 * 1024;

const tryStat = async (p) => {
  try {
    return await stat(p);
  } catch {
    return null;
  }
};

const totalBytes = async (dir) => {
  const info = await tryStat(dir);
  if (!info) return 0;
  if (info.isFile()) return info.size;
  if (!info.isDirectory()) return 0;
  const entries = await readdir(dir, { withFileTypes: true });
  let sum = 0;
  for (const entry of entries) {
    sum += await totalBytes(path.join(dir, entry.name));
  }
  return sum;
};

const main = async () => {
  const bytes = await totalBytes(SCENE_ROOT);
  const withReserve = bytes + LIGHTMAP_RESERVE_BYTES;
  const report = {
    script: 'verify-budgets',
    sceneBytes: bytes,
    lightmapReserveBytes: LIGHTMAP_RESERVE_BYTES,
    budgetBytes: BUDGET_BYTES,
    headroomBytes: BUDGET_BYTES - withReserve,
  };

  if (withReserve > BUDGET_BYTES) {
    console.log(JSON.stringify({ ...report, status: 'fail' }));
    process.exit(1);
  }
  console.log(JSON.stringify({ ...report, status: 'ok' }));
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
