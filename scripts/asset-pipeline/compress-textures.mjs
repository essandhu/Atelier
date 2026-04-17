#!/usr/bin/env node
// Encode textures from assets-src/textures/ (gitignored staging) into
// public/scene/textures/*.ktx2. UASTC for normal maps, ETC1S for everything
// else. Shells out to the `basisu` binary (must be on PATH); fails with an
// actionable message if it is missing or the staging directory is absent.
import { mkdir, readdir, rename, rm, stat } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';

const SOURCE_DIR = path.resolve(process.cwd(), 'assets-src/textures');
const OUTPUT_DIR = path.resolve(process.cwd(), 'public/scene/textures');
const TEXTURE_EXT = /\.(png|jpe?g|tga|tiff?|exr)$/i;

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
    args.push('-uastc', '-uastc_level', '2');
  } else {
    args.push('-comp_level', '2', '-q', '128');
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
