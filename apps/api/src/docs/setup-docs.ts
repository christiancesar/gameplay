import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { INestApplication } from '@nestjs/common'
import { apiReference } from '@scalar/nestjs-api-reference'
import { EnvService } from '../env/env.service'
import type { ApiDocs } from './generate-docs'

// Where scripts/export-docs writes the documents at build time.
export const EXPORTED_DOCS_DIR = __dirname
// The host of the Socket.IO server, filled in when the docs are served.
export const ASYNCAPI_HOST_PLACEHOLDER = 'gameplay.invalid'

// Production reads the documents exported at build time; elsewhere they are
// generated on start, so they follow the code while developing.
async function loadDocs(app: INestApplication, env: EnvService): Promise<ApiDocs> {
  if (env.get('NODE_ENV') === 'production') {
    const read = (name: string) => JSON.parse(readFileSync(join(EXPORTED_DOCS_DIR, name), 'utf8')) as object
    return { openApi: read('openapi.json'), asyncApi: read('asyncapi.json') }
  }
  const { generateDocs } = await import('./generate-docs.js')
  return generateDocs(app)
}

export async function setupDocs(app: INestApplication) {
  const env = app.get(EnvService)
  const http = app.getHttpAdapter()
  const { openApi, asyncApi } = await loadDocs(app, env)

  // The Socket.IO server is the public origin people open the docs from.
  const host = new URL(env.get('BETTER_AUTH_URL')).host
  const asyncApiForHost = JSON.parse(JSON.stringify(asyncApi).replaceAll(ASYNCAPI_HOST_PLACEHOLDER, host)) as object

  http.get('/api/docs/openapi.json', (_req: unknown, res: { json: (body: unknown) => void }) => res.json(openApi))
  http.get('/api/docs/asyncapi.json', (_req: unknown, res: { json: (body: unknown) => void }) =>
    res.json(asyncApiForHost),
  )

  // REST and Socket.IO docs on one page; the source picker switches between them.
  app.use(
    '/api/docs',
    apiReference({
      sources: [
        { title: 'REST', slug: 'rest', url: '/api/docs/openapi.json' },
        { title: 'Auth (Better Auth)', slug: 'auth', url: '/api/auth/open-api/generate-schema' },
        { title: 'Socket.IO events', slug: 'events', url: '/api/docs/asyncapi.json' },
      ],
    }),
  )
}
