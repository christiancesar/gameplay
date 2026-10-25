import { HttpStatus, NotFoundException } from '@nestjs/common'
import { ZodValidationException } from 'nestjs-zod'
import { z } from 'zod'
import { DomainError } from './domain-error'
import { resolveError } from './resolve-error'
import { toAckError } from './to-ack-error'

class ServerLimitReachedError extends DomainError {
  readonly code = 'SERVER_LIMIT_REACHED'
  override readonly status = HttpStatus.CONFLICT
}

describe('resolveError', () => {
  it('uses the code and status of a domain error', () => {
    expect(resolveError(new ServerLimitReachedError('You already own a server.'))).toEqual({
      status: 409,
      body: { code: 'SERVER_LIMIT_REACHED', message: 'You already own a server.' },
    })
  })

  it('groups validation issues by field', () => {
    const schema = z.object({ name: z.string().min(3), tags: z.array(z.string()) })
    const zodError = schema.safeParse({ name: 'a', tags: [1] }).error

    const { status, body } = resolveError(new ZodValidationException(zodError))

    expect(status).toBe(400)
    expect(body.code).toBe('VALIDATION_FAILED')
    expect(Object.keys(body.fields ?? {})).toEqual(['name', 'tags.0'])
  })

  it('names Nest HTTP exceptions by their status', () => {
    expect(resolveError(new NotFoundException('No such server.')).body).toEqual({
      code: 'NOT_FOUND',
      message: 'No such server.',
    })
  })

  it('hides unknown errors behind a generic 500', () => {
    expect(resolveError(new Error('db password is wrong'))).toEqual({
      status: 500,
      body: { code: 'INTERNAL_ERROR', message: 'Something went wrong.' },
    })
  })
})

describe('toAckError', () => {
  it('wraps the error body in a failed ack', () => {
    expect(toAckError(new ServerLimitReachedError('limit'))).toEqual({
      ok: false,
      error: { code: 'SERVER_LIMIT_REACHED', message: 'limit' },
    })
  })
})
