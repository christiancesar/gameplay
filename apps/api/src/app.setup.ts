import type { INestApplication } from '@nestjs/common'
import { Logger } from 'nestjs-pino'
import { EnvService } from './env/env.service'

// Shared by main.ts and the e2e tests, so both run the same app configuration.
export async function setupApp(app: INestApplication) {
  const env = app.get(EnvService)

  app.useLogger(app.get(Logger))
  app.setGlobalPrefix('api')
  app.enableShutdownHooks()

  if (env.get('DOCS_ENABLED') ?? env.get('NODE_ENV') !== 'production') {
    const { setupDocs } = await import('./docs/setup-docs.js')
    setupDocs(app)
  }
}
