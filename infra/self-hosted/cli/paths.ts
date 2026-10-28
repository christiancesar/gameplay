import { resolve } from 'node:path'
import type { EnvTarget } from './env-layout.ts'

/** infra/self-hosted: compose file, env files and nginx.conf. */
export const HOST_DIR = resolve(import.meta.dirname, '..')
export const REPO_DIR = resolve(HOST_DIR, '../..')

/** The host (tunnel, ports, database), the api container and the web build, each in its own file. */
export const ENV_PATHS: Record<EnvTarget, string> = {
  host: resolve(HOST_DIR, '.env'),
  api: resolve(HOST_DIR, '.env.api'),
  web: resolve(HOST_DIR, '.env.web'),
}
export const ENV_EXAMPLE_PATHS: Record<EnvTarget, string> = {
  host: resolve(HOST_DIR, '.env.example'),
  api: resolve(HOST_DIR, '.env.api.example'),
  web: resolve(HOST_DIR, '.env.web.example'),
}
