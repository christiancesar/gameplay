import { defineConfig, loadEnv } from 'vite'

import { sentrySourceMaps, sourceMapMode } from './sentry-source-maps'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // The main bundle gets the Sentry settings and the server of apps/desktop/.env, as the window does.
  const env = loadEnv(mode, import.meta.dirname, 'VITE_')
  return {
    define: {
      'import.meta.env.VITE_SENTRY_DSN': JSON.stringify(env.VITE_SENTRY_DSN ?? ''),
      'import.meta.env.VITE_SENTRY_ENVIRONMENT': JSON.stringify(env.VITE_SENTRY_ENVIRONMENT ?? ''),
      // What kind of build this is, and the server it is tied to (empty only in development).
      'import.meta.env.VITE_APP_ENV': JSON.stringify(env.VITE_APP_ENV ?? ''),
      'import.meta.env.VITE_SERVER_URL': JSON.stringify(env.VITE_SERVER_URL ?? ''),
    },
    plugins: sentrySourceMaps('.vite/build/**/*.map'),
    build: {
      sourcemap: sourceMapMode(),
      // Native and Linux only: it stays out of the bundle and is loaded from node_modules when the app runs.
      rollupOptions: { external: ['@vencord/venmic'] },
    },
  }
})
