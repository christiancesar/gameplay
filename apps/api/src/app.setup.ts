import type { INestApplication } from '@nestjs/common'
import { Logger } from 'nestjs-pino'

// Shared by main.ts and the e2e tests, so both run the same app configuration.
export function setupApp(app: INestApplication) {
  app.useLogger(app.get(Logger))
  app.setGlobalPrefix('api')
  app.enableShutdownHooks()
}
