/** The `VITE_*` of apps/desktop/.env (see .env.example) and the version that vite.renderer.config.ts adds. */
interface ImportMetaEnv {
  readonly VITE_SENTRY_DSN?: string
  readonly VITE_SENTRY_ENVIRONMENT?: string
  /** The version in package.json, baked in at build time. */
  readonly VITE_APP_VERSION: string
}
