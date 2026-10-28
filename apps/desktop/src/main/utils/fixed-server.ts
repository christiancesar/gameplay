import { serverOriginSchema } from '@gameplay/contracts'

const APP_ENVS = ['development', 'production'] as const

/**
 * The server a build is tied to, from `VITE_SERVER_URL` at build time, by the kind of build (`VITE_APP_ENV`).
 * Production must have one, and never asks the user. Development may leave it empty: the app then asks on the first
 * screen. A value the app cannot use stops the app (or the packaging) rather than falling back to a choice.
 */
function fixedServerFrom(appEnv: string | undefined, serverUrl: string | undefined): string | null {
  const env = appEnv?.trim()
  if (env !== 'development' && env !== 'production') {
    throw new Error(`VITE_APP_ENV must be ${APP_ENVS.join(' or ')}, not "${env ?? ''}"`)
  }
  const value = serverUrl?.trim()
  if (!value) {
    if (env === 'production') throw new Error('VITE_SERVER_URL is required when VITE_APP_ENV is production')
    return null
  }
  const parsed = serverOriginSchema.safeParse(value)
  if (!parsed.success) throw new Error(`VITE_SERVER_URL is not an origin the app can talk to: ${value}`)
  return parsed.data
}

export { fixedServerFrom }
