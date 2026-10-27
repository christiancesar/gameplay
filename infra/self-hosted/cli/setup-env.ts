import { copyFileSync, existsSync } from 'node:fs'
import { type SelfHostedEnv, selfHostedEnvSchema } from '@gameplay/env'
import { EnvFile } from './env-file.ts'
import { ENV_SOURCES, hintFor } from './env-sources.ts'
import { HostError } from './shell.ts'

/** Names shared with infra/production: [old name, current name]. */
const RENAMED_KEYS = [['PUBLIC_URL', 'APP_URL']] as const

/**
 * Creates the .env from the example on the first run, renames old keys and
 * generates the secrets left empty. Returns the admin password when it was
 * generated now, to show it once.
 */
export function prepareEnv(
  envPath: string,
  examplePath: string,
): { env: EnvFile; generatedAdminPassword: string | null } {
  if (!existsSync(envPath)) {
    copyFileSync(examplePath, envPath)
    console.log(`Created ${envPath}`)
  }
  const env = new EnvFile(envPath)
  for (const [oldKey, newKey] of RENAMED_KEYS) env.rename(oldKey, newKey)

  let generatedAdminPassword: string | null = null
  for (const [key, source] of Object.entries(ENV_SOURCES)) {
    if (source.kind !== 'generated' || env.get(key)) continue
    const value = source.generate()
    env.set(key, value)
    if (key === 'ADMIN_PASSWORD') generatedAdminPassword = value
  }
  return { env, generatedAdminPassword }
}

/**
 * Validates the .env with the shared schema and returns it typed, defaults
 * applied. Lists every problem at once, with where to get what is missing.
 */
export function validateEnv(env: EnvFile): SelfHostedEnv {
  // Empty values count as unset, as in docker compose's ${VAR:-default}.
  const values = Object.fromEntries(Object.entries(env.values()).filter(([, value]) => value !== ''))
  const result = selfHostedEnvSchema.safeParse(values)
  if (result.success) return result.data

  const problems = result.error.issues.map((issue) => {
    const key = issue.path.join('.')
    const hint = hintFor(key)
    return `  - ${key}: ${issue.message}${hint ? ` (${hint})` : ''}`
  })
  throw new HostError(`fix these variables in ${env.path}:\n${problems.join('\n')}`)
}
