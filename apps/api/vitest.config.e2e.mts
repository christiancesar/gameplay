import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['test/e2e/**/*.e2e-spec.ts'],
    globalSetup: ['./test/support/global-setup.ts'],
    // The suites share one database, so they run one file at a time.
    fileParallelism: false,
    env: {
      NODE_ENV: 'test',
      LOG_LEVEL: process.env.E2E_LOG_LEVEL ?? 'silent',
      BETTER_AUTH_SECRET: 'e2e-secret-e2e-secret-e2e-secret-e2e',
      BETTER_AUTH_URL: 'http://localhost:3333',
      REGISTRATION_KEY_SECRET: 'e2e-key-secret-e2e-key-secret-e2e-key',
      DATABASE_URL: process.env.TEST_DATABASE_URL ?? 'postgresql://gameplay:gameplay@localhost:5432/gameplay_test',
    },
  },
})
