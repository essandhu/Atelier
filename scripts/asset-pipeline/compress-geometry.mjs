#!/usr/bin/env node
// Draco-compress every .glb under public/scene/models/. No-op if the directory
// is empty (Phase 1 ships no geometry).
import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(process.cwd(), 'public/scene/models');

const tryStat = async (p) => {
  try {
    return await stat(p);
  } catch {
    return null;
  }
};

const walk = async (dir) => {
  const info = await tryStat(dir);
  if (!info || !info.isDirectory()) return [];
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(full)));
    } else if (entry.isFile() && full.endsWith('.glb')) {
      files.push(full);
    }
  }
  return files;
};

const main = async () => {
  const glbs = await walk(ROOT);
  if (glbs.length === 0) {
    console.log(
      JSON.stringify({
        script: 'compress-geometry',
        status: 'noop',
        reason: 'no .glb files under public/scene/models',
      }),
    );
    return;
  }

  const { NodeIO } = await import('@gltf-transform/core');
  const { draco } = await import('@gltf-transform/functions');

  const io = new NodeIO();
  for (const file of glbs) {
    const doc = await io.read(file);
    await doc.transform(draco());
    await io.write(file, doc);
    console.log(
      JSON.stringify({ script: 'compress-geometry', file, status: 'ok' }),
    );
  }
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
