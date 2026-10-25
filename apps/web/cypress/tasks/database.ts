import pg from 'pg'

import { readApiEnv } from './api-env.ts'

let pool: pg.Pool | undefined

/** One small pool for the whole Cypress run, pointed at the dev Postgres the API uses. */
function database(): pg.Pool {
  pool ??= new pg.Pool({ connectionString: readApiEnv().databaseUrl, max: 3 })
  return pool
}

async function closeDatabase(): Promise<void> {
  await pool?.end()
  pool = undefined
}

export { closeDatabase, database }
