import type { Config } from 'tailwindcss';

// Tailwind v4's configuration lives primarily in CSS (see `src/app/globals.css`
// and — landing in Phase 2 — `src/styles/tokens.css`). This file exists mainly
// to declare the content globs tooling expects.
const config: Config = {
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/ui/**/*.{ts,tsx}',
    './src/scene/**/*.{ts,tsx}',
    './src/interaction/**/*.{ts,tsx}',
    './src/telemetry/**/*.{ts,tsx}',
  ],
};

export default config;
