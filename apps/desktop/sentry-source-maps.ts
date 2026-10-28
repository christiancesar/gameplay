import { sentryVitePlugin } from '@sentry/vite-plugin'
import type { PluginOption } from 'vite'

import pkg from './package.json' with { type: 'json' }

/**
 * Uploads the source maps of a build to the Sentry project of the app, then deletes them so they never ship in the
 * installer. Off without a token (development and local builds). The release is the one the app reports itself as.
 */
function sentrySourceMaps(maps: string): PluginOption[] {
  if (!process.env.SENTRY_AUTH_TOKEN) return []
  return [
    sentryVitePlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      release: { name: `gameplay-desktop@${pkg.version}` },
      sourcemaps: { filesToDeleteAfterUpload: [maps] },
      telemetry: false,
    }),
  ]
}

/** `hidden`: the maps exist for the upload and the bundle never points to them. */
const sourceMapMode = () => (process.env.SENTRY_AUTH_TOKEN ? ('hidden' as const) : false)

export { sentrySourceMaps, sourceMapMode }
