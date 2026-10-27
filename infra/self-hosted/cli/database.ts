import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { compose } from './compose.ts'
import type { EnvFile } from './env-file.ts'
import { REPO_DIR } from './paths.ts'
import { HostError, run } from './shell.ts'

/**
 * Applies the Prisma migrations from the repository, through the database port
 * bound to loopback: no image carries the Prisma CLI (a dev dependency of the api).
 */
export function migrateDatabase(env: EnvFile): void {
  if (!existsSync(resolve(REPO_DIR, 'node_modules/.bin/prisma'))) {
    throw new HostError("the Prisma CLI is missing: run 'npm ci' at the repository root")
  }
  const password = encodeURIComponent(env.get('POSTGRES_PASSWORD'))
  const url = `postgresql://gameplay:${password}@127.0.0.1:${env.get('POSTGRES_HOST_PORT')}/gameplay`
  run('npx', ['prisma', 'migrate', 'deploy'], {
    cwd: resolve(REPO_DIR, 'apps/api'),
    env: { DATABASE_URL: url },
    failure: 'the migrations failed',
  })
}

/**
 * Creates (or promotes) the platform admin inside the running api container,
 * which already has the compiled seed script. Safe to rerun.
 */
export function seedAdmin(env: EnvFile): void {
  const variables = ['ADMIN_EMAIL', 'ADMIN_USERNAME', 'ADMIN_PASSWORD'].flatMap((key) => [
    '-e',
    `${key}=${env.get(key)}`,
  ])
  compose(['exec', '-T', ...variables, 'api', 'node', 'apps/api/dist/scripts/seed-admin'], {
    failure: 'the admin seed failed',
  })
}
