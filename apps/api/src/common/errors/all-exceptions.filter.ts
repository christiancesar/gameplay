import { type ArgumentsHost, Catch, type ExceptionFilter, HttpStatus, Logger } from '@nestjs/common'
import type { ErrorResponse } from '@gameplay/shared'
import type { Response } from 'express'
import { resolveError } from './resolve-error'

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name)

  catch(exception: unknown, host: ArgumentsHost) {
    // Socket.IO errors are answered through acks (toAckError), not here.
    if (host.getType() !== 'http') return

    const { status, body } = resolveError(exception)
    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(exception instanceof Error ? exception.stack : exception)
    }

    const response: ErrorResponse = { error: body }
    host.switchToHttp().getResponse<Response>().status(status).json(response)
  }
}
