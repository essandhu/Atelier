#!/usr/bin/env node
// Phase 9 (P9-01) fixture round-trip: drive compress-textures.mjs against
// scripts/asset-pipeline/fixtures/ and assert a non-empty `.ktx2` lands in
// a temp output directory. Developer-local verification — `basisu` must
// still be on PATH; CI doesn't run this script.
//
// Not intended as a CI gate. `assets:build:fixture` is the developer
// smoke-test invocable as `pnpm assets:build:fixture`.
import { mkdtemp, readdir, rm, stat } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_DIR = path.join(__dirname, 'fixtures');

const log = (payload) =>
  console.log(
    JSON.stringify({ script: 'compress-textures-fixture', ...payload }),
  );

const runCompress = (env) =>
  new Promise((resolve, reject) => {
    const compressScript = path.join(__dirname, 'compress-textures.mjs');
    const proc = spawn('node', [compressScript], {
      env: { ...process.env, ...env },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (c) => (stdout += c.toString()));
    proc.stderr.on('data', (c) => (stderr += c.toString()));
    proc.on('error', reject);
    proc.on('exit', (code) => resolve({ code, stdout, stderr }));
  });

// Parse the last JSON-per-line from compress-textures stdout so we can
// distinguish "basisu missing" (expected in environments without the
// toolchain) from real pipeline failures.
const parseLastPayload = (stdout) => {
  const lines = stdout
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  for (let i = lines.length - 1; i >= 0; i--) {
    try {
      return JSON.parse(lines[i]);
    } catch {
      continue;
    }
  }
  return null;
};

const main = async () => {
  const fixtureInfo = await stat(FIXTURE_DIR).catch(() => null);
  if (!fixtureInfo || !fixtureInfo.isDirectory()) {
    log({
      status: 'fail',
      reason: 'fixtures directory missing',
      hint: `expected ${FIXTURE_DIR} to exist`,
    });
    process.exit(1);
  }

  const outDir = await mkdtemp(path.join(tmpdir(), 'atelier-fixture-'));
  try {
    const { code, stdout } = await runCompress({
      TEXTURE_SOURCE_DIR: FIXTURE_DIR,
      TEXTURE_OUTPUT_DIR: outDir,
    });
    const payload = parseLastPayload(stdout);

    // Graceful skip on environments without basisu — documented in
    // public/scene/README.md "Phase 9 compression review". The fixture
    // round-trip is developer-local verification; CI doesn't run it.
    if (
      code !== 0 &&
      payload?.status === 'fail' &&
      payload.message === 'basisu binary not found on PATH'
    ) {
      log({
        status: 'skip',
        reason: 'basisu binary not installed',
        hint: payload.hint,
      });
      return;
    }

    if (code !== 0) {
      log({
        status: 'fail',
        reason: 'compress-textures exited non-zero',
        compressPayload: payload,
      });
      process.exit(1);
    }

    const produced = (await readdir(outDir)).filter((f) => f.endsWith('.ktx2'));
    if (produced.length === 0) {
      log({
        status: 'fail',
        reason: 'no .ktx2 files produced',
        compressPayload: payload,
      });
      process.exit(1);
    }
    const first = path.join(outDir, produced[0]);
    const { size } = await stat(first);
    if (size === 0) {
      log({
        status: 'fail',
        reason: 'produced .ktx2 is empty',
        output: first,
      });
      process.exit(1);
    }
    log({
      status: 'ok',
      fixtureDir: FIXTURE_DIR,
      outputDir: outDir,
      produced,
      firstOutputBytes: size,
      encoderParams: payload,
      message:
        'fixture round-trip OK — pipeline produces non-empty .ktx2 from committed PNG',
    });
  } finally {
    await rm(outDir, { recursive: true, force: true });
  }
};

main().catch((err) => {
  console.error(err.stack ?? err.message);
  process.exit(1);
});
