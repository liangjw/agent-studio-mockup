import { defineConfig } from 'vitest/config';

export default defineConfig({
  environment: 'node',
  test: {
    include: ['src/**/*.test.ts'],
  },
});
