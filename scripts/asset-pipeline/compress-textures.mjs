#!/usr/bin/env node
// Classify textures under public/scene/textures/ by channel and compress
// (UASTC for normals, ETC1S for albedo/roughness). No-op if empty.
import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(process.cwd(), 'public/scene/textures');

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
    } else if (entry.isFile() && /\.(png|jpg|jpeg)$/i.test(full)) {
      files.push(full);
    }
  }
  return files;
};

const classify = (file) => (/normal/i.test(file) ? 'uastc' : 'etc1s');

const main = async () => {
  const textures = await walk(ROOT);
  if (textures.length === 0) {
    console.log(
      JSON.stringify({
        script: 'compress-textures',
        status: 'noop',
        reason: 'no textures under public/scene/textures',
      }),
    );
    return;
  }

  for (const file of textures) {
    const mode = classify(file);
    console.log(
      JSON.stringify({
        script: 'compress-textures',
        file,
        mode,
        status: 'queued',
      }),
    );
    // Real implementation lands when Phase 2 adds the first texture; we then
    // swap this log for a `@gltf-transform` ktx2 transform (or a basisu CLI
    // call) driven by the `mode` classification above.
  }
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
