import { randomUUID } from 'node:crypto'
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino'
import { EnvService } from '../env/env.service'

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
      transport: env.get('NODE_ENV') === 'development' ? { target: 'pino-pretty' } : undefined,
    },
  }),
})
