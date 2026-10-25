import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express'
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http'
import { NestInstrumentation } from '@opentelemetry/instrumentation-nestjs-core'
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg'
import { PinoInstrumentation } from '@opentelemetry/instrumentation-pino'
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-proto'
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-proto'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto'
import { defaultResource, resourceFromAttributes } from '@opentelemetry/resources'
import { BatchLogRecordProcessor } from '@opentelemetry/sdk-logs'
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics'
import { NodeSDK } from '@opentelemetry/sdk-node'
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions'
import { PrismaInstrumentation } from '@prisma/instrumentation'
import { config } from 'dotenv'

// OpenTelemetry for traces, metrics and logs, sent over OTLP (Grafana Cloud).
// Started by otel-start.ts, the first import of main.ts: the instrumentations
// patch http, express, nest, pg and pino when they are first required, so they
// must be registered before. The exporters read OTEL_EXPORTER_OTLP_ENDPOINT,
// _HEADERS and _PROTOCOL themselves; without an endpoint nothing starts, and
// the app runs as before (dev without Grafana). Tests never start it.

const ATTR_DEPLOYMENT_ENVIRONMENT = 'deployment.environment.name'

function serviceVersion(): string {
  try {
    const manifest = JSON.parse(readFileSync(join(__dirname, '../../package.json'), 'utf8')) as { version?: string }
    return manifest.version ?? 'unknown'
  } catch {
    return 'unknown'
  }
}

let sdk: NodeSDK | null = null

export function startTelemetry(): void {
  // The Nest ConfigModule loads .env later; the SDK needs it now. Variables
  // already set (container env) win.
  config({ quiet: true })
  if (sdk || !process.env.OTEL_EXPORTER_OTLP_ENDPOINT) return

  sdk = new NodeSDK({
    resource: defaultResource().merge(
      resourceFromAttributes({
        [ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME ?? 'gameplay-api',
        [ATTR_SERVICE_VERSION]: serviceVersion(),
        [ATTR_DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV ?? 'development',
      }),
    ),
    traceExporter: new OTLPTraceExporter(),
    metricReaders: [new PeriodicExportingMetricReader({ exporter: new OTLPMetricExporter() })],
    logRecordProcessors: [new BatchLogRecordProcessor({ exporter: new OTLPLogExporter() })],
    instrumentations: [
      new HttpInstrumentation(),
      new ExpressInstrumentation(),
      new NestInstrumentation(),
      new PgInstrumentation(),
      new PrismaInstrumentation(),
      // Adds trace_id and span_id to every pino line and sends the lines as
      // OTLP logs too.
      new PinoInstrumentation(),
    ],
  })
  sdk.start()
}

// Flushes what is still buffered. Does nothing when telemetry is off.
export async function shutdownTelemetry(): Promise<void> {
  await sdk?.shutdown()
  sdk = null
}
