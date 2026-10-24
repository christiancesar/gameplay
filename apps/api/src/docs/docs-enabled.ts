import type { EnvService } from '../env/env.service'

// API docs are on outside production unless DOCS_ENABLED says otherwise.
export function isDocsEnabled(env: EnvService): boolean {
  return env.get('DOCS_ENABLED') ?? env.get('NODE_ENV') !== 'production'
}
