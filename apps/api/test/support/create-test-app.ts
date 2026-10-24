import type { INestApplication, ModuleMetadata } from '@nestjs/common'
import { Test, type TestingModuleBuilder } from '@nestjs/testing'
import { AppModule } from '../../src/app.module'
import { setupApp } from '../../src/app.setup'

type Options = {
  // Extra modules for the test only (fake controllers, gateways).
  imports?: ModuleMetadata['imports']
  // Swaps providers, e.g. a failing PrismaService.
  override?: (builder: TestingModuleBuilder) => TestingModuleBuilder
}

// Boots the whole app as main.ts does.
export async function createTestApp({ imports = [], override }: Options = {}): Promise<INestApplication> {
  const builder = Test.createTestingModule({ imports: [AppModule, ...imports] })
  const moduleRef = await (override ? override(builder) : builder).compile()
  const app = moduleRef.createNestApplication({ bufferLogs: true, bodyParser: false })
  await setupApp(app)
  await app.init()
  return app
}
