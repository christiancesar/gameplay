import type { INestApplication } from '@nestjs/common'
import type { NestExpressApplication } from '@nestjs/platform-express'
import { Logger } from 'nestjs-pino'
import { isDocsEnabled } from './docs/docs-enabled'
import { EnvService } from './env/env.service'

// Shared by main.ts and the e2e tests, so both run the same app configuration.
export async function setupApp(app: INestApplication) {
  const env = app.get(EnvService)

  app.useLogger(app.get(Logger))
  app.setGlobalPrefix('api')
  // request.ip comes from X-Forwarded-For only through these proxy hops.
  ;(app as NestExpressApplication).set('trust proxy', env.get('TRUST_PROXY_HOPS'))
  app.enableShutdownHooks()

  // In production nginx serves the upload directory.
  if (env.get('STORAGE_DRIVER') === 'local' && env.get('NODE_ENV') !== 'production') {
    const prefix = new URL(env.get('PUBLIC_UPLOADS_URL'), 'http://localhost').pathname
    ;(app as NestExpressApplication).useStaticAssets(env.get('STORAGE_LOCAL_DIR'), { prefix, index: false })
  }

  if (isDocsEnabled(env)) {
    const { setupDocs } = await import('./docs/setup-docs.js')
    setupDocs(app)
  }
}
