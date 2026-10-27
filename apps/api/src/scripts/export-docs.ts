import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { NestFactory } from '@nestjs/core'
import { AppModule } from '../app.module'
import { generateDocs } from '../docs/generate-docs'
import { EXPORTED_DOCS_DIR } from '../docs/setup-docs'

// Writes the REST and Socket.IO documents next to the compiled docs module,
// so production serves them without the dev-only generators. The app is
// created but never started: no database connection, any valid env works.
//   node apps/api/dist/scripts/export-docs   (Dockerfile, builder stage)
async function main() {
  const app = await NestFactory.create(AppModule, { bodyParser: false, logger: ['error', 'warn'] })
  app.setGlobalPrefix('api')

  const { openApi, asyncApi } = generateDocs(app)
  writeFileSync(join(EXPORTED_DOCS_DIR, 'openapi.json'), JSON.stringify(openApi))
  writeFileSync(join(EXPORTED_DOCS_DIR, 'asyncapi.json'), JSON.stringify(asyncApi))
}

void main().then(
  () => process.exit(0),
  (error: unknown) => {
    console.error(error)
    process.exit(1)
  },
)
