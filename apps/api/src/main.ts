// Must stay the first import (see lib/otel.ts).
import './lib/otel-start'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { setupApp } from './app.setup'
import { EnvService } from './env/env.service'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    // Better Auth reads the raw body; the auth module re-adds the parsers for the other routes.
    bodyParser: false,
  })
  await setupApp(app)
  await app.listen(app.get(EnvService).get('PORT'))
}
void bootstrap()
