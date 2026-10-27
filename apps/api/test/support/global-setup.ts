import { execFileSync } from 'node:child_process'
import { Client } from 'pg'
import type { TestProject } from 'vitest/node'

// Creates the test database on its server when missing (CREATE DATABASE has no IF NOT EXISTS).
async function ensureDatabase(databaseUrl: string) {
  const url = new URL(databaseUrl)
  const name = decodeURIComponent(url.pathname.slice(1))
  url.pathname = '/postgres'
  const client = new Client({ connectionString: url.toString() })
  await client.connect()
  try {
    const { rowCount } = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [name])
    if (!rowCount) await client.query(`CREATE DATABASE "${name.replaceAll('"', '""')}"`)
  } finally {
    await client.end()
  }
}

// Creates the test database and applies the migrations once, before the e2e suite.
// Runs in the main process, which does not get `test.env`, so the database
// url comes from the project config.
export default async function setup(project: TestProject) {
  const databaseUrl = project.config.env.DATABASE_URL
  if (!databaseUrl) throw new Error('DATABASE_URL is missing in vitest.config.e2e.mts')
  await ensureDatabase(databaseUrl)
  execFileSync('npx', ['prisma', 'migrate', 'deploy'], {
    env: { ...process.env, DATABASE_URL: databaseUrl, PRISMA_HIDE_UPDATE_MESSAGE: '1' },
    stdio: 'inherit',
  })
}
