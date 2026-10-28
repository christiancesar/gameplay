import { copyFileSync, existsSync } from 'node:fs'
import { basename } from 'node:path'
import { type SelfHostedEnv, selfHostedEnvSchema } from '@gameplay/env'
import { ENV_TARGETS, type EnvTarget, targetOf } from './env-layout.ts'
import { ENV_SOURCES, hintFor } from './env-sources.ts'
import { HostEnv } from './host-env.ts'
import { HostError } from './shell.ts'

/** Names shared with infra/production: [old name, current name]. */
const RENAMED_KEYS = [['PUBLIC_URL', 'APP_URL']] as const

/**
 * Creates each env file from its example on the first run, moves the api and web variables out of an .env from
 * before the split, renames old keys and generates the secrets left empty. Returns the admin password when it was
 * generated now, to show it once.
 */
export function prepareEnv(
  paths: Record<EnvTarget, string>,
  examples: Record<EnvTarget, string>,
): { env: HostEnv; generatedAdminPassword: string | null } {
  for (const target of ENV_TARGETS) {
    if (existsSync(paths[target])) continue
    copyFileSync(examples[target], paths[target])
    console.log(`Created ${paths[target]}`)
  }
  const env = new HostEnv(paths)
  const moved = env.moveLegacyKeys()
  if (moved.length > 0) {
    console.log(`Moved ${moved.length} variables out of ${paths.host} into ${paths.api} and ${paths.web}`)
  }
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
 * Validates the three env files, read as one, with the shared schema and returns it typed, defaults
 * applied. Lists every problem at once, with where to get what is missing.
 */
export function validateEnv(env: HostEnv): SelfHostedEnv {
  // Empty values count as unset, as in docker compose's ${VAR:-default}.
  const values = Object.fromEntries(Object.entries(env.values()).filter(([, value]) => value !== ''))
  const result = selfHostedEnvSchema.safeParse(values)
  if (result.success) return result.data

  const problems = result.error.issues.map((issue) => {
    const key = issue.path.join('.')
    const hint = hintFor(key)
    return `  - ${key} (${basename(env.files[targetOf(key)].path)}): ${issue.message}${hint ? ` (${hint})` : ''}`
  })
  throw new HostError(`fix these variables:\n${problems.join('\n')}`)
}
