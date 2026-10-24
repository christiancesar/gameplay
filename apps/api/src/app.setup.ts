import type { INestApplication } from '@nestjs/common'
import { Logger } from 'nestjs-pino'
import { isDocsEnabled } from './docs/docs-enabled'
import { EnvService } from './env/env.service'

// Shared by main.ts and the e2e tests, so both run the same app configuration.
export async function setupApp(app: INestApplication) {
  const env = app.get(EnvService)

  app.useLogger(app.get(Logger))
  app.setGlobalPrefix('api')
  app.enableShutdownHooks()

  if (isDocsEnabled(env)) {
    const { setupDocs } = await import('./docs/setup-docs.js')
    setupDocs(app)
  }
}
