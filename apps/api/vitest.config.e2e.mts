import { tmpdir } from 'node:os'
import { join } from 'node:path'
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
      STORAGE_LOCAL_DIR: join(tmpdir(), 'gameplay-e2e-uploads'),
      // S3-compatible mock from infra/docker-compose.dev.yml.
      S3_TEST_ENDPOINT: process.env.S3_TEST_ENDPOINT ?? 'http://localhost:9090',
      REGISTRATION_KEY_SECRET: 'e2e-key-secret-e2e-key-secret-e2e-key',
      // As behind nginx: X-Forwarded-For decides request.ip.
      TRUST_PROXY_HOPS: '1',
      // Short, so the e2e can watch a voice seat expire.
      ROOM_RECONNECT_GRACE_MS: '300',
      // The SFU suite brings a fake; nothing here reaches Cloudflare, whatever .env holds.
      CLOUDFLARE_SFU_APP_ID: '',
      CLOUDFLARE_SFU_APP_TOKEN: '',
      CLOUDFLARE_ACCOUNT_ID: '',
      CLOUDFLARE_ANALYTICS_TOKEN: '',
      DATABASE_URL: process.env.TEST_DATABASE_URL ?? 'postgresql://gameplay:gameplay@localhost:5432/gameplay_test',
    },
  },
})
