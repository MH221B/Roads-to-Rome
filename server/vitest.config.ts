import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./src/tests/setup.ts'],
    testTimeout: 20000,
    hookTimeout: 20000,
  },
  esbuild: {
    target: 'node18',
  },
});
