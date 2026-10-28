import path from 'node:path'
import { defineConfig } from 'vitest/config'

// The renderer imports the client package, whose sources use the `@/` alias of that package.
const clientSrc = path.resolve(import.meta.dirname, '../../packages/client/src')

export default defineConfig({ resolve: { alias: { '@': clientSrc } } })
