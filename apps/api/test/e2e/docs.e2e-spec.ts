import { Module } from '@nestjs/common'
import type { INestApplication } from '@nestjs/common'
import { MessageBody, SubscribeMessage, WebSocketGateway } from '@nestjs/websockets'
import { createZodDto } from 'nestjs-zod'
import request from 'supertest'
import { z } from 'zod'
import { AsyncApiReceive } from '../../src/docs/asyncapi-decorators'
import { createTestApp } from '../support/create-test-app'

class PingDto extends createZodDto(z.object({ at: z.number() })) {}

@WebSocketGateway()
class DocsTestGateway {
  @SubscribeMessage('test:ping')
  @AsyncApiReceive({ channel: 'test:ping', summary: 'Ping from the client', message: { payload: PingDto } })
  ping(@MessageBody() body: PingDto) {
    return body
  }
}

@Module({ providers: [DocsTestGateway] })
class DocsTestModule {}

describe('API docs (e2e)', () => {
  let app: INestApplication

  beforeAll(async () => {
    app = await createTestApp({ imports: [DocsTestModule] })
  })

  afterAll(async () => {
    await app.close()
  })

  it('serves the OpenAPI document with the routes', async () => {
    const response = await request(app.getHttpServer()).get('/api/docs/openapi.json')

    expect(response.status).toBe(200)
    expect(response.body.paths).toHaveProperty('/api/health')
    expect(response.body.components.schemas).toHaveProperty('HealthReportDto_Output')
  })

  it('serves the AsyncAPI document with the gateway events', async () => {
    const response = await request(app.getHttpServer()).get('/api/docs/asyncapi.json')

    expect(response.status).toBe(200)
    expect(JSON.stringify(response.body)).toContain('test:ping')
  })

  it('serves the OpenAPI document of the auth routes', async () => {
    const response = await request(app.getHttpServer()).get('/api/auth/open-api/generate-schema')

    expect(response.status).toBe(200)
    expect(Object.keys(response.body.paths)).toContain('/sign-in/username')
  })

  it('serves the Scalar page', async () => {
    const response = await request(app.getHttpServer()).get('/api/docs')

    expect(response.status).toBe(200)
    expect(response.headers['content-type']).toContain('text/html')
  })
})
