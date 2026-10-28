/** The `VITE_*` of apps/desktop/.env (see .env.example), baked into the main bundle by vite.main.config.ts. */
interface ImportMetaEnv {
  readonly VITE_SENTRY_DSN?: string
  readonly VITE_SENTRY_ENVIRONMENT?: string
  /** `development` or `production`: production must have a server, development may leave it empty. */
  readonly VITE_APP_ENV?: string
  /** The server the build is tied to. */
  readonly VITE_SERVER_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
