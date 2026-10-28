import * as Sentry from '@sentry/react'

import type { TelemetryConfig } from '@/shared/platform/platform'

import { onServer } from '../../server-url'
import { scrubEvent } from './scrub-event'

/** Part of the traces that are recorded; the errors are always sent. */
const TRACES_SAMPLE_RATE = 0.1

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * Where the browser adds the headers that continue its trace in the API: the `/api` of the page's own origin and,
 * on the desktop, the `/api` of whichever server the user picks (it is not known when Sentry starts, and the app
 * calls no other `/api`). `serverUrl` narrows it when the host already knows it.
 */
function propagationTargets(app: TelemetryConfig['app'], serverUrl: string): RegExp[] {
  if (serverUrl) return [/^\/api\//, new RegExp(`^${escapeRegExp(serverUrl)}/api/`)]
  return app === 'desktop' ? [/^\/api\//, /^https?:\/\/[^/]+\/api\//] : [/^\/api\//]
}

/**
 * The options Sentry starts with: errors, Replay on errors, traces of the page loads and navigations (named by
 * the route, through the router) and of the `/api` calls, logs and metrics. `router` is the TanStack router.
 */
function sentryOptions(config: TelemetryConfig, serverUrl: string, router: unknown): Sentry.BrowserOptions {
  const { dsn, tunnel } = config.sentry ?? { dsn: '' }
  return {
    dsn,
    environment: config.environment,
    release: config.release || undefined,
    initialScope: { tags: { app: config.app } },
    // Path of the server forwarded to Sentry, so ad blockers don't drop the events.
    tunnel: tunnel ? onServer(tunnel, serverUrl) : undefined,
    // v11 has no sendDefaultPii option: personal data is off unless opted in, and scrubEvent strips the rest.
    integrations: [
      Sentry.tanstackRouterBrowserTracingIntegration(router),
      Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true }),
    ],
    tracesSampleRate: TRACES_SAMPLE_RATE,
    tracePropagationTargets: propagationTargets(config.app, serverUrl),
    // The API continues the trace with the W3C header. While Faro is on it adds that header itself, and two of
    // them would break the trace.
    propagateTraceparent: config.faro === null,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1,
    beforeSend: scrubEvent,
  }
}

export { propagationTargets, sentryOptions, TRACES_SAMPLE_RATE }
