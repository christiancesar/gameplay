import path from 'node:path'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// The front-end lives in packages/client: the router plugin reads its routes and `@/` points to its src.
const clientSrc = path.resolve(import.meta.dirname, '../../packages/client/src')

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    // Precisa vir antes do react(): gera app/route-tree.gen.ts a partir de app/routes, no pacote do client.
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
      routesDirectory: path.join(clientSrc, 'app/routes'),
      generatedRouteTree: path.join(clientSrc, 'app/route-tree.gen.ts'),
    }),
    react(),
    tailwindcss(),
    // Last plugin. Production builds with a token upload the source maps to
    // Sentry and delete them, so nginx never serves them.
    ...(process.env.SENTRY_AUTH_TOKEN
      ? [
          sentryVitePlugin({
            org: process.env.SENTRY_ORG,
            project: process.env.SENTRY_PROJECT,
            authToken: process.env.SENTRY_AUTH_TOKEN,
            release: { name: process.env.VITE_SENTRY_RELEASE || undefined },
            sourcemaps: { filesToDeleteAfterUpload: ['./dist/**/*.map'] },
            telemetry: false,
          }),
        ]
      : []),
  ],
  // Hidden: generated for the Sentry upload, never referenced by the bundle.
  build: { sourcemap: process.env.SENTRY_AUTH_TOKEN ? 'hidden' : false },
  resolve: {
    alias: {
      '@': clientSrc,
    },
  },
  // Mesmo domínio que o nginx em produção: os cookies do Better Auth funcionam sem CORS.
  server: {
    proxy: {
      '/api': 'http://localhost:3333',
      '/socket.io': { target: 'http://localhost:3333', ws: true },
      // Avatars, icons and covers of the local storage driver (nginx serves this path in production).
      '/uploads': 'http://localhost:3333',
    },
  },
})
