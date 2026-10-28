import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // The main bundle gets the Sentry settings of apps/desktop/.env, as the window does.
  const env = loadEnv(mode, import.meta.dirname, 'VITE_')
  return {
    define: {
      'import.meta.env.VITE_SENTRY_DSN': JSON.stringify(env.VITE_SENTRY_DSN ?? ''),
      'import.meta.env.VITE_SENTRY_ENVIRONMENT': JSON.stringify(env.VITE_SENTRY_ENVIRONMENT ?? ''),
    },
    build: {
      // Native and Linux only: it stays out of the bundle and is loaded from node_modules when the app runs.
      rollupOptions: { external: ['@vencord/venmic'] },
    },
  }
})
