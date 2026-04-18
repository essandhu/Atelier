#!/usr/bin/env node
// Encode textures from assets-src/textures/ (gitignored staging) into
// public/scene/textures/*.ktx2. UASTC for normal maps, ETC1S for everything
// else. Shells out to the `basisu` binary (must be on PATH); fails with an
// actionable message if it is missing or the staging directory is absent.
//
// Phase 9 (P9-01):
// - SOURCE_DIR and OUTPUT_DIR honour TEXTURE_SOURCE_DIR / TEXTURE_OUTPUT_DIR
//   env-var overrides so `compress-textures-fixture.mjs` can drive a
//   round-trip against the committed fixture PNG without touching the real
//   staging + public directories.
// - Per-file `{ status: 'ok', ... }` payload gains `uastcLevel`, `compLevel`,
//   `q` fields documenting the exact encoder params used. These values
//   feed the Phase 10 byte-savings diff.
import { mkdir, readdir, rename, rm, stat } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';

const resolveDir = (envName, fallback) =>
  process.env[envName]
    ? path.resolve(process.cwd(), process.env[envName])
    : path.resolve(process.cwd(), fallback);

const SOURCE_DIR = resolveDir('TEXTURE_SOURCE_DIR', 'assets-src/textures');
const OUTPUT_DIR = resolveDir('TEXTURE_OUTPUT_DIR', 'public/scene/textures');
const TEXTURE_EXT = /\.(png|jpe?g|tga|tiff?|exr)$/i;

// Phase 9 params decision (P9-01): reviewed against the Phase 10 PBR intake
// requirement. UASTC level 2 + ETC1S `-comp_level 2 -q 128` remain the
// correct call for a portfolio scene — UASTC 2 preserves normal-map vector
// accuracy at the smallest size still perceptually lossless, and ETC1S
// q=128 hits the quality/size sweet spot for 1024² albedo/roughness maps.
// Raising UASTC to 4 is 2× encode time with marginal quality gain on
// diffuse content; lowering to 0 shows banding on low-frequency normals.
const UASTC_LEVEL = 2;
const ETC1S_COMP_LEVEL = 2;
const ETC1S_Q = 128;

const tryStat = async (p) => {
  try {
    return await stat(p);
  } catch {
    return null;
  }
};

const log = (payload) =>
  console.log(JSON.stringify({ script: 'compress-textures', ...payload }));

const fail = (message, hint) => {
  log({ status: 'fail', message, hint });
  process.exit(1);
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
    } else if (entry.isFile() && TEXTURE_EXT.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
};

const classify = (file) =>
  /normal/i.test(path.basename(file)) ? 'uastc' : 'etc1s';

const ensureBasisu = () =>
  new Promise((resolve) => {
    const probe = spawn('basisu', ['-version'], { stdio: 'ignore' });
    probe.on('error', () => resolve(false));
    probe.on('exit', (code) => resolve(code === 0));
  });

const runBasisu = (args) =>
  new Promise((resolve, reject) => {
    const proc = spawn('basisu', args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stderr = '';
    proc.stderr.on('data', (c) => (stderr += c.toString()));
    proc.on('error', reject);
    proc.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`basisu exited ${code}: ${stderr.trim()}`));
    });
  });

const encodeOne = async (file) => {
  const mode = classify(file);
  const inputBytes = (await stat(file)).size;
  const baseName = path.basename(file).replace(TEXTURE_EXT, '');
  const finalPath = path.join(OUTPUT_DIR, `${baseName}.ktx2`);
  const args = ['-ktx2', '-file', file, '-output_path', OUTPUT_DIR];
  if (mode === 'uastc') {
    args.push('-uastc', '-uastc_level', String(UASTC_LEVEL));
  } else {
    args.push('-comp_level', String(ETC1S_COMP_LEVEL), '-q', String(ETC1S_Q));
  }
  await runBasisu(args);
  // basisu writes <basename>.ktx2 into -output_path; ensure that file exists.
  const written = path.join(OUTPUT_DIR, `${baseName}.ktx2`);
  const writtenInfo = await tryStat(written);
  if (!writtenInfo) {
    throw new Error(`basisu did not produce ${written}`);
  }
  if (written !== finalPath) {
    await rm(finalPath, { force: true });
    await rename(written, finalPath);
  }
  return {
    file,
    output: finalPath,
    mode,
    inputBytes,
    outputBytes: writtenInfo.size,
    uastcLevel: mode === 'uastc' ? UASTC_LEVEL : null,
    compLevel: mode === 'etc1s' ? ETC1S_COMP_LEVEL : null,
    q: mode === 'etc1s' ? ETC1S_Q : null,
  };
};

const main = async () => {
  const sourceInfo = await tryStat(SOURCE_DIR);
  if (!sourceInfo) {
    log({
      status: 'noop',
      reason: 'no assets-src/textures staging directory',
      hint: `mkdir -p ${path.relative(process.cwd(), SOURCE_DIR)} and drop your PNG/JPG/EXR sources into it.`,
    });
    return;
  }
  const sources = await walk(SOURCE_DIR);
  if (sources.length === 0) {
    log({
      status: 'noop',
      reason: 'staging directory is empty',
      sourceDir: path.relative(process.cwd(), SOURCE_DIR),
    });
    return;
  }
  if (!(await ensureBasisu())) {
    fail(
      'basisu binary not found on PATH',
      'Install KTX-Software / basisu (https://github.com/BinomialLLC/basis_universal) and ensure `basisu -version` succeeds.',
    );
  }
  await mkdir(OUTPUT_DIR, { recursive: true });
  for (const source of sources) {
    const result = await encodeOne(source);
    log({ status: 'ok', ...result });
  }
};

main().catch((err) => {
  console.error(err.stack ?? err.message);
  process.exit(1);
});
