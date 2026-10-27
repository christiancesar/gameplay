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

// Lucide "book-open" as the tab icon: white on dark browser tabs, dark on light ones.
const FAVICON_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#171717" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
  '<style>@media (prefers-color-scheme: dark) { svg { stroke: #ffffff } }</style>' +
  '<path d="M12 5v16"/>' +
  '<path d="M20.001 19A2 2 0 0022 17V5a2 2 0 00-1.999-2L16 3.002A5 5 0 0012 5a5 5 0 00-4-2H4a2 2 0 00-2 2v12a2 2 0 001.999 2H8a5 5 0 014 2 5 5 0 014-2z"/>' +
  '</svg>'
const FAVICON = `data:image/svg+xml,${encodeURIComponent(FAVICON_SVG)}`

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
      favicon: FAVICON,
      sources: [
        { title: 'REST', slug: 'rest', url: '/api/docs/openapi.json' },
        { title: 'Auth (Better Auth)', slug: 'auth', url: '/api/auth/open-api/generate-schema' },
        { title: 'Socket.IO events', slug: 'events', url: '/api/docs/asyncapi.json' },
      ],
    }),
  )
}
