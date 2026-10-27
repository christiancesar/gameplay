import type { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { PrismaService } from '../../src/lib/prisma'
import { InMemoryStorageProvider } from '../../src/modules/storage/drivers/in-memory-storage.provider'
import { StorageProvider } from '../../src/modules/storage/storage.provider'
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
    app = await createTestApp({
      override: (builder) =>
        builder.overrideProvider(PrismaService).useValue({
          $queryRaw: () => Promise.reject(new Error('connection refused')),
          $disconnect: () => Promise.resolve(),
        }),
    })

    const response = await request(app.getHttpServer()).get('/api/health')

    expect(response.status).toBe(503)
    expect(response.body).toEqual({ status: 'error', database: 'down' })
  })
})

describe('GET /api/health/details (e2e)', () => {
  let app: INestApplication

  afterEach(async () => {
    await app.close()
  })

  it('answers 200 with every component operational', async () => {
    app = await createTestApp()

    const response = await request(app.getHttpServer()).get('/api/health/details')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      status: 'operational',
      checkedAt: expect.any(String),
      components: {
        database: { status: 'operational', latencyMs: expect.any(Number) },
        storage: { status: 'operational', latencyMs: expect.any(Number) },
      },
    })
  })

  it('answers 503 on a storage outage while /api/health stays 200', async () => {
    const storage = new InMemoryStorageProvider()
    storage.failing = true
    app = await createTestApp({ override: (builder) => builder.overrideProvider(StorageProvider).useValue(storage) })

    const details = await request(app.getHttpServer()).get('/api/health/details')
    const health = await request(app.getHttpServer()).get('/api/health')

    expect(details.status).toBe(503)
    expect(details.body.status).toBe('outage')
    expect(details.body.components.storage.status).toBe('outage')
    expect(health.status).toBe(200)
  })
})
