import { randomBytes } from 'node:crypto'
import { copyFileSync, existsSync } from 'node:fs'
import { EnvFile } from './env-file.ts'
import { HostError } from './shell.ts'

const randomSecret = (bytes: number) => randomBytes(bytes).toString('hex')

/** Names shared with infra/production: [old name, current name]. */
const RENAMED_KEYS = [['PUBLIC_URL', 'APP_URL']] as const

/**
 * Creates the .env from the example on the first run, renames old keys and
 * fills the secrets left empty. Returns the admin password when it was
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

  if (!env.get('POSTGRES_PASSWORD')) env.set('POSTGRES_PASSWORD', randomSecret(24))
  if (!env.get('BETTER_AUTH_SECRET')) env.set('BETTER_AUTH_SECRET', randomSecret(32))
  if (!env.get('REGISTRATION_KEY_SECRET')) env.set('REGISTRATION_KEY_SECRET', randomSecret(32))
  if (!env.get('POSTGRES_HOST_PORT')) env.set('POSTGRES_HOST_PORT', '5433')
  let generatedAdminPassword: string | null = null
  if (!env.get('ADMIN_PASSWORD')) {
    generatedAdminPassword = randomSecret(12)
    env.set('ADMIN_PASSWORD', generatedAdminPassword)
  }

  for (const key of ['ADMIN_EMAIL', 'ADMIN_USERNAME']) {
    if (!env.get(key)) throw new HostError(`${key} is empty in ${envPath}`)
  }
  return { env, generatedAdminPassword }
}
