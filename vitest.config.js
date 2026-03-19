import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['api/tests/**/*.test.js'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      include: ['api/**/*.js'],
      exclude: ['api/app.js', 'api/config.js']
    }
  }
});