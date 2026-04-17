import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const srcPath = fileURLToPath(new URL('./src', import.meta.url));
const serverOnlyStub = fileURLToPath(
  new URL('./tests/stubs/server-only.ts', import.meta.url),
);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^@\/(.*)$/, replacement: `${srcPath}/$1` },
      { find: /^server-only$/, replacement: serverOnlyStub },
    ],
  },
  test: {
    globals: false,
    environment: 'node',
    include: [
      'tests/unit/**/*.test.ts',
      'tests/unit/**/*.test.tsx',
      'tests/component/**/*.test.ts',
      'tests/component/**/*.test.tsx',
    ],
    setupFiles: ['tests/setup.ts'],
    environmentMatchGlobs: [['tests/component/**', 'happy-dom']],
  },
});
