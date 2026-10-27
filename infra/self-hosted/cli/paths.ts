import { resolve } from 'node:path'

/** infra/self-hosted: compose file, .env and nginx.conf. */
export const HOST_DIR = resolve(import.meta.dirname, '..')
export const REPO_DIR = resolve(HOST_DIR, '../..')
export const ENV_FILE = resolve(HOST_DIR, '.env')
export const ENV_EXAMPLE_FILE = resolve(HOST_DIR, '.env.example')
