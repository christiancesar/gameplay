import { faro, getWebInstrumentations, initializeFaro, LogLevel, TransportItemType } from '@grafana/faro-web-sdk'
import { TracingInstrumentation } from '@grafana/faro-web-tracing'

import type { TelemetryConfig } from '@/shared/platform/platform'

import { onServer } from '../../server-url'
import type { Telemetry } from '../telemetry'
import { type FaroApi, FaroTelemetry } from './faro.telemetry'

const LEVELS = { info: LogLevel.INFO, warn: LogLevel.WARN, error: LogLevel.ERROR }

/**
 * Starts Grafana Faro: Web Vitals, sessions, views and traces of the `/api` calls, linked to the API traces.
 * Errors and console stay out: Sentry owns errors. Null (and nothing started) without a collector. In
 * self-hosting the url is the tunnel of the server (same origin on the web, `serverUrl` on the desktop) that
 * nginx forwards to the collector.
 */
function createFaroTelemetry(config: TelemetryConfig, serverUrl: string): Telemetry | null {
  if (!config.faro) return null

  initializeFaro({
    url: onServer(config.faro.url, serverUrl),
    // The name is the one the call quality dashboard filters on (service_name).
    app: { name: `gameplay-${config.app}`, version: config.release || 'dev', environment: config.environment },
    instrumentations: [...getWebInstrumentations({ captureConsole: false }), new TracingInstrumentation()],
    // Its own beacons and the socket's long polling would only add noise to the traces.
    ignoreUrls: [/\/monitoring\//, /\/socket\.io\//],
    beforeSend: (item) => (item.type === TransportItemType.EXCEPTION ? null : item),
  })
  const api = faro.api
  if (!api) return null
  const adapter: FaroApi = {
    setUser: (user) => api.setUser(user),
    resetUser: () => api.resetUser(),
    setView: (view) => api.setView(view),
    pushMeasurement: (measurement, options) => api.pushMeasurement(measurement, options),
    pushLog: (args, options) =>
      api.pushLog(args, { level: options?.level && LEVELS[options.level], context: options?.context }),
  }
  return new FaroTelemetry(adapter)
}

export { createFaroTelemetry }
