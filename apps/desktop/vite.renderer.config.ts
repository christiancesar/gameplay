import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// The front-end lives in packages/client: the router plugin reads its routes and `@/` points to its src.
const clientSrc = path.resolve(import.meta.dirname, '../../packages/client/src')

// https://vite.dev/config/
export default defineConfig({
  // The app serves the build from app://gameplay/ and falls back to index.html on any path, so assets are
  // absolute: a relative base would break a reload on a nested route.
  base: '/',
  plugins: [
    // Must come before react(): writes app/route-tree.gen.ts from app/routes, in the client package.
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
      routesDirectory: path.join(clientSrc, 'app/routes'),
      generatedRouteTree: path.join(clientSrc, 'app/route-tree.gen.ts'),
    }),
    react(),
    tailwindcss(),
  ],
  resolve: { alias: { '@': clientSrc } },
})
