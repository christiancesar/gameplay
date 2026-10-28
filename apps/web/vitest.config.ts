import path from 'node:path'
import { defineConfig } from 'vitest/config'

// The specs of the shell import the platform entry of the client, whose files use its `@/` alias.
export default defineConfig({
  resolve: { alias: { '@': path.resolve(import.meta.dirname, '../../packages/client/src') } },
  test: { environment: 'node', include: ['src/**/*.spec.ts'] },
})
