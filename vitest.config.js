import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./app/tests/setup.js'],
    sequence: {
      concurrent: false,
    },
    fileParallelism: false, 
    include: ['app/tests/**/*.test.js'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      include: ['app/**/*.js'],
      exclude: ['app/app.js', 'app/config.js']
    }
  }
});