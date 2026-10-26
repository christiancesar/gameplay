import type { INestApplication } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { AsyncApiDocumentBuilder, AsyncApiModule } from 'nestjs-asyncapi'
import { cleanupOpenApiDoc } from 'nestjs-zod'
import { ASYNCAPI_HOST_PLACEHOLDER } from './setup-docs'

export type ApiDocs = { openApi: object; asyncApi: object }

// Builds the REST and Socket.IO documents from the app's decorators. Needs
// nestjs-asyncapi, a dev dependency: production images get the JSON files
// written at build time (scripts/export-docs) instead.
export function generateDocs(app: INestApplication): ApiDocs {
  const openApi = cleanupOpenApiDoc(
    SwaggerModule.createDocument(app, new DocumentBuilder().setTitle('Gameplay API').setVersion('0.0.0').build()),
  )
  const asyncApi = AsyncApiModule.createDocument(
    app,
    new AsyncApiDocumentBuilder()
      .setTitle('Gameplay realtime events')
      .setVersion('0.0.0')
      .setDefaultContentType('application/json')
      .addServer('api', { host: ASYNCAPI_HOST_PLACEHOLDER, pathname: '/socket.io', protocol: 'socket.io' })
      .build(),
  )
  return { openApi, asyncApi }
}
