import { execFileSync } from 'node:child_process'

// Applies the migrations to the test database once, before the e2e suite.
export default function setup() {
  execFileSync('npx', ['prisma', 'migrate', 'deploy'], {
    env: { ...process.env, PRISMA_HIDE_UPDATE_MESSAGE: '1' },
    stdio: 'inherit',
  })
}
