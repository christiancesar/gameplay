import { type ArgumentsHost, Catch, type ExceptionFilter, Logger } from '@nestjs/common'
import { resolveError } from './resolve-error'
import { toAckError } from './to-ack-error'

// Global filters skip gateways, so each gateway binds this one with
// @UseFilters. It answers the event's ack (third handler argument) with the
// error contract; events sent without an ack just drop the error.
@Catch()
export class WsAckExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(WsAckExceptionFilter.name)

  catch(exception: unknown, host: ArgumentsHost) {
    if (resolveError(exception).status >= 500) {
      this.logger.error(exception instanceof Error ? exception.stack : exception)
    }
    const ack: unknown = host.getArgByIndex(2)
    if (typeof ack === 'function') ack(toAckError(exception))
  }
}
