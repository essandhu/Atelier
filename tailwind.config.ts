import type { Config } from 'tailwindcss';

// Tailwind v4's configuration is CSS-first (see `src/styles/tokens.css` and
// `src/app/globals.css`). This file only declares content globs.
const config: Config = {
  content: [
    './src/**/*.{ts,tsx,css}',
  ],
};

export default config;
