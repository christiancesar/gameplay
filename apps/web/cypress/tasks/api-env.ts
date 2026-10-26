import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

type ApiEnv = { databaseUrl: string; registrationKeySecret: string }

/** Reads the two values the tasks need from `apps/api/.env`. Nothing is logged or sent to the browser. */
function readApiEnv(): ApiEnv {
  const file = readFileSync(resolve(import.meta.dirname, '../../../api/.env'), 'utf8')
  const values = new Map<string, string>()
  for (const line of file.split('\n')) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line)
    if (match) values.set(match[1], match[2].replace(/^(["'])(.*)\1$/, '$2'))
  }
  const databaseUrl = values.get('DATABASE_URL')
  const registrationKeySecret = values.get('REGISTRATION_KEY_SECRET')
  if (!databaseUrl || !registrationKeySecret)
    throw new Error('DATABASE_URL and REGISTRATION_KEY_SECRET are required in apps/api/.env')
  return { databaseUrl, registrationKeySecret }
}

export { readApiEnv }
