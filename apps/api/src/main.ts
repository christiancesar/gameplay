import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { setupApp } from './app.setup'
import { EnvService } from './env/env.service'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true })
  setupApp(app)
  await app.listen(app.get(EnvService).get('PORT'))
}
void bootstrap()
