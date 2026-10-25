import { HttpException, HttpStatus } from '@nestjs/common'
import type { ErrorBody } from '@gameplay/shared'
import { ZodError } from 'zod'
import { ZodValidationException } from 'nestjs-zod'
import { DomainError } from './domain-error'

export type ResolvedError = {
  status: number
  body: ErrorBody
}

// Single mapping from any thrown value to the error contract, shared by the
// HTTP filter and the Socket.IO acks.
export function resolveError(exception: unknown): ResolvedError {
  if (exception instanceof DomainError) {
    return { status: exception.status, body: { code: exception.code, message: exception.message } }
  }

  if (exception instanceof ZodValidationException) {
    const zodError = exception.getZodError()
    return {
      status: HttpStatus.BAD_REQUEST,
      body: {
        code: 'VALIDATION_FAILED',
        message: 'The request has invalid fields.',
        fields: zodError instanceof ZodError ? groupIssuesByField(zodError) : undefined,
      },
    }
  }

  if (exception instanceof HttpException) {
    const status = exception.getStatus()
    return { status, body: { code: HttpStatus[status] ?? 'HTTP_ERROR', message: exception.message } }
  }

  return {
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    body: { code: 'INTERNAL_ERROR', message: 'Something went wrong.' },
  }
}

function groupIssuesByField(error: ZodError): Record<string, string[]> {
  const fields: Record<string, string[]> = {}
  for (const issue of error.issues) {
    const path = issue.path.join('.') || '_root'
    ;(fields[path] ??= []).push(issue.message)
  }
  return fields
}
