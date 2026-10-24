import type { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { PrismaService } from '../../src/lib/prisma'
import { resetDatabase } from '../support/database'
import { createTestApp } from '../support/create-test-app'

describe('GET /api/health (e2e)', () => {
  let app: INestApplication

  afterEach(async () => {
    await app.close()
  })

  it('answers 200 when the database is up', async () => {
    app = await createTestApp()
    await resetDatabase(app.get(PrismaService))

    const response = await request(app.getHttpServer()).get('/api/health')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ status: 'ok', database: 'up' })
    expect(response.headers['x-request-id']).toBeDefined()
  })

  it('answers 503 when the database is down', async () => {
    app = await createTestApp((builder) =>
      builder.overrideProvider(PrismaService).useValue({
        $queryRaw: () => Promise.reject(new Error('connection refused')),
        $disconnect: () => Promise.resolve(),
      }),
    )

    const response = await request(app.getHttpServer()).get('/api/health')

    expect(response.status).toBe(503)
    expect(response.body).toMatchObject({ status: 'error', database: 'down' })
  })
})
