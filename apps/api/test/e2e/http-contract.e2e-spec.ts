import { Body, Controller, Get, HttpStatus, Module, Post } from '@nestjs/common'
import type { INestApplication } from '@nestjs/common'
import { usernameSchema } from '@gameplay/contracts'
import { AllowAnonymous } from '@thallesp/nestjs-better-auth'
import { createZodDto } from 'nestjs-zod'
import request from 'supertest'
import { z } from 'zod'
import { DomainError } from '../../src/common/errors/domain-error'
import { createTestApp } from '../support/create-test-app'

class ProfileDto extends createZodDto(z.object({ username: usernameSchema, age: z.number().int().min(13) })) {}

class NameTakenError extends DomainError {
  readonly code = 'NAME_TAKEN'
  override readonly status = HttpStatus.CONFLICT
}

@AllowAnonymous()
@Controller('contract-test')
class ContractTestController {
  @Post()
  create(@Body() body: ProfileDto) {
    return body
  }

  @Get('taken')
  taken() {
    throw new NameTakenError('That name is taken.')
  }

  @Get('crash')
  crash() {
    throw new Error('secret detail')
  }
}

@Module({ controllers: [ContractTestController] })
class ContractTestModule {}

describe('HTTP contract (e2e)', () => {
  let app: INestApplication

  beforeAll(async () => {
    app = await createTestApp({ imports: [ContractTestModule] })
  })

  afterAll(async () => {
    await app.close()
  })

  it('accepts a body that matches the shared schema', async () => {
    const response = await request(app.getHttpServer()).post('/api/contract-test').send({ username: 'ana_01', age: 20 })

    expect(response.status).toBe(201)
    expect(response.body).toEqual({ username: 'ana_01', age: 20 })
  })

  it('answers 400 with the issues grouped by field', async () => {
    const response = await request(app.getHttpServer()).post('/api/contract-test').send({ username: 'a', age: 10 })

    expect(response.status).toBe(400)
    expect(response.body.error.code).toBe('VALIDATION_FAILED')
    expect(Object.keys(response.body.error.fields)).toEqual(['username', 'age'])
  })

  it('answers a domain error with its code and status', async () => {
    const response = await request(app.getHttpServer()).get('/api/contract-test/taken')

    expect(response.status).toBe(409)
    expect(response.body).toEqual({ error: { code: 'NAME_TAKEN', message: 'That name is taken.' } })
  })

  it('hides unexpected errors', async () => {
    const response = await request(app.getHttpServer()).get('/api/contract-test/crash')

    expect(response.status).toBe(500)
    expect(response.body).toEqual({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong.' } })
  })

  it('answers unknown routes with the same error shape', async () => {
    const response = await request(app.getHttpServer()).get('/api/nope')

    expect(response.status).toBe(404)
    expect(response.body.error.code).toBe('NOT_FOUND')
  })
})
