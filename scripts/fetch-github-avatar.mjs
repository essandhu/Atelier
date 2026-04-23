// Fetches the owner's GitHub avatar and writes it to public/scene/avatar.jpg.
//
// Usage:
//   pnpm assets:fetch-avatar                # real run, writes the JPEG
//   pnpm assets:fetch-avatar --dry-run      # logs the target URL + path, writes nothing
//   GITHUB_USERNAME=octocat node scripts/fetch-github-avatar.mjs
//
// Design notes:
// - Resolves username from --username=<name> argv, then GITHUB_USERNAME env,
//   then falls back to the profile.ts default ('essandhu'). Keeping the
//   resolution order shallow avoids a runtime .ts parse.
// - Uses Node 20's built-in fetch + Node streams for zero extra deps.
// - Fails fast with exit code 1 on validation / network / non-2xx errors so
//   a CI `assets:build` run surfaces the regression instead of silently
//   shipping a stale avatar.
// - Idempotent: overwrites public/scene/avatar.jpg on every run. The wrapped
//   Response redirect to avatars.githubusercontent.com is followed by fetch.
//
// Pure helpers (`avatarUrlFor`, `validateResponse`) are exported so
// tests/unit/github-avatar.test.ts can exercise them without mocking fetch
// or the filesystem.

import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

const DEFAULT_USERNAME = 'essandhu';
const AVATAR_SIZE = 460;

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = resolve(__dirname, '../public/scene/avatar.jpg');

export const avatarUrlFor = (username) => {
  if (typeof username !== 'string' || username.trim() === '') {
    throw new Error(
      'fetch-github-avatar: username is required (empty or non-string). ' +
        'Pass --username=<name>, set GITHUB_USERNAME, or edit the DEFAULT_USERNAME.',
    );
  }
  return `https://github.com/${encodeURIComponent(
    username.trim(),
  )}.png?size=${AVATAR_SIZE}`;
};

export const validateResponse = (response) => {
  if (!response.ok) {
    const target = response.url || '(unknown url)';
    throw new Error(
      `fetch-github-avatar: non-2xx response ${response.status} ` +
        `${response.statusText ?? ''} for ${target}`.trim(),
    );
  }
  return response;
};

const parseArgs = (argv) => {
  let username;
  let dryRun = false;
  for (const raw of argv) {
    if (raw === '--dry-run') {
      dryRun = true;
    } else if (raw.startsWith('--username=')) {
      username = raw.slice('--username='.length);
    }
  }
  return { username, dryRun };
};

const resolveUsername = (cliUsername) =>
  cliUsername ?? process.env.GITHUB_USERNAME ?? DEFAULT_USERNAME;

const main = async () => {
  const { username: cliUsername, dryRun } = parseArgs(process.argv.slice(2));
  const username = resolveUsername(cliUsername);
  const url = avatarUrlFor(username);

  if (dryRun) {
    console.log(
      JSON.stringify({
        status: 'dry-run',
        username,
        url,
        outPath: OUT_PATH,
        note: 'no bytes written; expected payload size is a few kB (JPEG).',
      }),
    );
    return;
  }

  let response;
  try {
    response = await fetch(url, { redirect: 'follow' });
  } catch (err) {
    console.error(
      `fetch-github-avatar: network error fetching ${url}: ${err?.message ?? err}`,
    );
    process.exitCode = 1;
    return;
  }

  try {
    validateResponse(response);
  } catch (err) {
    console.error(err.message);
    process.exitCode = 1;
    return;
  }

  if (!response.body) {
    console.error(
      `fetch-github-avatar: response for ${url} had no body`,
    );
    process.exitCode = 1;
    return;
  }

  await mkdir(dirname(OUT_PATH), { recursive: true });
  await pipeline(
    Readable.fromWeb(response.body),
    createWriteStream(OUT_PATH),
  );

  console.log(
    JSON.stringify({
      status: 'ok',
      username,
      url,
      outPath: OUT_PATH,
    }),
  );
};

// Only run when invoked directly; importing for unit tests must not
// trigger a network call.
const invokedDirectly =
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (invokedDirectly) {
  main().catch((err) => {
    console.error(err?.stack ?? err);
    process.exitCode = 1;
  });
}
