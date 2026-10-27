import { type CallHandler, type ExecutionContext, Injectable, type NestInterceptor } from '@nestjs/common'
import { MESSAGE_METADATA } from '@nestjs/websockets/constants'
import { type Observable, tap } from 'rxjs'
import { DomainError } from '../../../common/errors/domain-error'
import { RealtimeMetrics } from '../providers/realtime-metrics/realtime-metrics.provider'

// Times every client event on the gateway and counts the failures by error
// name. Runs before the ack filter, so it sees the original error.
@Injectable()
export class RealtimeMetricsInterceptor implements NestInterceptor {
  constructor(private readonly metrics: RealtimeMetrics) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const event = (Reflect.getMetadata(MESSAGE_METADATA, context.getHandler()) as string | undefined) ?? 'unknown'
    const startedAt = performance.now()
    const seconds = () => (performance.now() - startedAt) / 1000

    return next.handle().pipe(
      tap({
        next: () => this.metrics.handled(event, seconds(), 'ok'),
        error: (error: unknown) => this.metrics.handled(event, seconds(), 'error', errorType(error)),
      }),
    )
  }
}

// Domain errors by their contract code (NOT_IN_ROOM), anything else by class name.
function errorType(error: unknown): string {
  if (error instanceof DomainError) return error.code
  return error instanceof Error ? error.name : 'Unknown'
}
