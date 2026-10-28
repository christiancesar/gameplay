/** The `VITE_*` of apps/desktop/.env (see .env.example), baked into the main bundle by vite.main.config.ts. */
interface ImportMetaEnv {
  readonly VITE_SENTRY_DSN?: string
  readonly VITE_SENTRY_ENVIRONMENT?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
