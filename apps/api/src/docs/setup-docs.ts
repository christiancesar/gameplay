import type { INestApplication } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { apiReference } from '@scalar/nestjs-api-reference'
import { AsyncApiDocumentBuilder, AsyncApiModule } from 'nestjs-asyncapi'
import { cleanupOpenApiDoc } from 'nestjs-zod'
import { EnvService } from '../env/env.service'

// Loaded only when docs are enabled. nestjs-asyncapi and Scalar are dev
// dependencies, so this file is never required by the production image.
export function setupDocs(app: INestApplication) {
  const http = app.getHttpAdapter()
  const port = app.get(EnvService).get('PORT')

  const openApi = cleanupOpenApiDoc(
    SwaggerModule.createDocument(app, new DocumentBuilder().setTitle('Gameplay API').setVersion('0.0.0').build()),
  )
  const asyncApi = AsyncApiModule.createDocument(
    app,
    new AsyncApiDocumentBuilder()
      .setTitle('Gameplay realtime events')
      .setVersion('0.0.0')
      .setDefaultContentType('application/json')
      .addServer('api', { host: `localhost:${port}`, pathname: '/socket.io', protocol: 'socket.io' })
      .build(),
  )

  http.get('/api/docs/openapi.json', (_req: unknown, res: { json: (body: unknown) => void }) => res.json(openApi))
  http.get('/api/docs/asyncapi.json', (_req: unknown, res: { json: (body: unknown) => void }) => res.json(asyncApi))

  // REST and Socket.IO docs on one page; the source picker switches between them.
  app.use(
    '/api/docs',
    apiReference({
      sources: [
        { title: 'REST', slug: 'rest', url: '/api/docs/openapi.json' },
        { title: 'Socket.IO events', slug: 'events', url: '/api/docs/asyncapi.json' },
      ],
    }),
  )
}
