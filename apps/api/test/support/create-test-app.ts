import type { INestApplication } from '@nestjs/common'
import { Test, type TestingModuleBuilder } from '@nestjs/testing'
import { AppModule } from '../../src/app.module'
import { setupApp } from '../../src/app.setup'

// Boots the whole app as main.ts does. `override` swaps providers for a test.
export async function createTestApp(
  override?: (builder: TestingModuleBuilder) => TestingModuleBuilder,
): Promise<INestApplication> {
  const builder = Test.createTestingModule({ imports: [AppModule] })
  const moduleRef = await (override ? override(builder) : builder).compile()
  const app = moduleRef.createNestApplication({ bufferLogs: true })
  setupApp(app)
  await app.init()
  return app
}
