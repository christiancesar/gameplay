import { execFileSync } from 'node:child_process'
import type { TestProject } from 'vitest/node'

// Applies the migrations to the test database once, before the e2e suite.
// Runs in the main process, which does not get `test.env`, so the database
// url comes from the project config.
export default function setup(project: TestProject) {
  execFileSync('npx', ['prisma', 'migrate', 'deploy'], {
    env: { ...process.env, DATABASE_URL: project.config.env.DATABASE_URL, PRISMA_HIDE_UPDATE_MESSAGE: '1' },
    stdio: 'inherit',
  })
}
