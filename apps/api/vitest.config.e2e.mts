import { existsSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { parse } from 'dotenv'
import { defineConfig } from 'vitest/config'

// The e2e database: TEST_DATABASE_URL, or the server of DATABASE_URL in .env with the
// gameplay_test database (the global setup creates it).
function testDatabaseUrl(): string {
  if (process.env.TEST_DATABASE_URL) return process.env.TEST_DATABASE_URL
  const devUrl = existsSync('.env') ? parse(readFileSync('.env')).DATABASE_URL : undefined
  if (!devUrl) return 'postgresql://gameplay:gameplay@localhost:5432/gameplay_test'
  const url = new URL(devUrl)
  url.pathname = '/gameplay_test'
  return url.toString()
}

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
      DATABASE_URL: testDatabaseUrl(),
    },
  },
})
