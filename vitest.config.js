import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['app/tests/**/*.test.js'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      include: ['app/**/*.js'],
      exclude: ['app/app.js', 'app/config.js']
    }
  }
});