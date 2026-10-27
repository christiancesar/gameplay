import { randomUUID } from 'node:crypto'
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino'
import { EnvService } from '../env/env.service'

// Level of the "request completed" line. Nest's exception filter answers
// errors itself, so pino-http only sees the status code: without this every
// request, 500s included, would be logged as info.
export function requestLogLevel(statusCode: number, error?: Error): 'info' | 'warn' | 'error' {
  if (error || statusCode >= 500) return 'error'
  if (statusCode >= 400) return 'warn'
  return 'info'
}

// JSON logs in production; readable lines in development. Every request gets
// an id (reused from X-Request-Id when the proxy sends one).
export const LoggerModule = PinoLoggerModule.forRootAsync({
  inject: [EnvService],
  useFactory: (env: EnvService) => ({
    pinoHttp: {
      level: env.get('LOG_LEVEL'),
      genReqId: (req, res) => {
        const id = req.headers['x-request-id']?.toString() ?? randomUUID()
        res.setHeader('X-Request-Id', id)
        return id
      },
      // The container healthcheck calls it every few seconds.
      autoLogging: { ignore: (req) => req.url === '/api/health' },
      customLogLevel: (_req, res, error) => requestLogLevel(res.statusCode, error),
      transport: env.get('NODE_ENV') === 'development' ? { target: 'pino-pretty' } : undefined,
    },
  }),
})
