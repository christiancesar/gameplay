import { faro, getWebInstrumentations, initializeFaro, TransportItemType } from '@grafana/faro-web-sdk'
import { TracingInstrumentation } from '@grafana/faro-web-tracing'
import { onServer } from './server-url'

/** The slice of the router Faro follows: the route of each resolved navigation names the view. */
type FaroRouter = {
  subscribe: (event: 'onResolved', listener: () => void) => () => void
  state: { matches: readonly { routeId: string }[] }
}

/** Measurement values are numbers; the context holds the labels (strings). */
type Measurement = { type: string; values: Record<string, number>; context?: Record<string, string> }

/** What the app sends to Faro besides its own instrumentation. Every call is a no-op before `initFaro`. */
type MetricsSdk = {
  setUser: (user: { id: string } | null) => void
  measure: (measurement: Measurement) => void
}

/**
 * Starts Grafana Faro: Web Vitals, sessions, views and traces of the `/api` calls, linked to the API
 * traces. Errors and console stay out: Sentry owns errors. Does nothing (returns false) without
 * `VITE_FARO_URL`, which in self-hosting is the tunnel of the server (same origin on the web, `serverUrl` on the
 * desktop) that nginx forwards to the collector.
 */
function initFaro(router: FaroRouter, serverUrl = ''): boolean {
  const url = import.meta.env.VITE_FARO_URL
  if (!url) return false

  initializeFaro({
    url: onServer(url, serverUrl),
    app: {
      name: 'gameplay-web',
      version: import.meta.env.VITE_SENTRY_RELEASE || 'dev',
      environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE,
    },
    instrumentations: [...getWebInstrumentations({ captureConsole: false }), new TracingInstrumentation()],
    // Its own beacons and the socket's long polling would only add noise to the traces.
    ignoreUrls: [/\/monitoring\//, /\/socket\.io\//],
    beforeSend: (item) => (item.type === TransportItemType.EXCEPTION ? null : item),
  })

  const setView = () => {
    const routeId = router.state.matches.at(-1)?.routeId
    // The route pattern (/servers/$serverId), never the URL: no ids in the view names.
    if (routeId) faro.api?.setView({ name: routeId })
  }
  setView()
  router.subscribe('onResolved', setView)
  return true
}

const faroMetrics: MetricsSdk = {
  setUser: (user) => (user ? faro.api?.setUser({ id: user.id }) : faro.api?.resetUser()),
  measure: ({ type, values, context }) => faro.api?.pushMeasurement({ type, values }, { context, skipDedupe: true }),
}

export { faroMetrics, initFaro }
export type { FaroRouter, Measurement, MetricsSdk }
