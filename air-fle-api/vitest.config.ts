import { defineConfig } from 'vitest/config';
import swc from '@swc/core';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.e2e-vitest.ts', '**/*.spec.ts'],
    root: './',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'test/']
    },
  },
}); 