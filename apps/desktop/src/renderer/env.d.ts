/** The `VITE_*` of apps/desktop/.env (see .env.example) and the version that vite.renderer.config.ts adds. */
interface ImportMetaEnv {
  readonly VITE_SENTRY_DSN?: string
  readonly VITE_SENTRY_ENVIRONMENT?: string
  /** The server the build is tied to. Empty in development, where the user picks one. */
  readonly VITE_SERVER_URL?: string
  /** The version in package.json, baked in at build time. */
  readonly VITE_APP_VERSION: string
}
