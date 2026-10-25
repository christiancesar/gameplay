import type { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { PrismaService } from '../../src/lib/prisma'
import { createTestApp } from '../support/create-test-app'
import { resetDatabase } from '../support/database'
import { signedIn } from '../support/signed-in'

// The e2e env trusts one proxy hop (TRUST_PROXY_HOPS=1) and uses stun-only.
describe('ICE config (e2e)', () => {
  let app: INestApplication

  beforeAll(async () => {
    app = await createTestApp()
    await resetDatabase(app.get(PrismaService))
  })

  afterAll(async () => {
    await app.close()
  })

  it('returns the STUN servers and the IP set by the proxy', async () => {
    const { agent } = await signedIn(app)

    const response = await agent.get('/api/ice').set('X-Forwarded-For', '203.0.113.7')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      iceServers: [{ urls: ['stun:stun.cloudflare.com:3478'] }],
      ttlSeconds: 0,
      requestIp: '203.0.113.7',
    })
  })

  it('takes only the hop added by the trusted proxy', async () => {
    const { agent } = await signedIn(app)

    // The client forged the first entry; the proxy appended the real one.
    const response = await agent.get('/api/ice').set('X-Forwarded-For', '198.51.100.1, 203.0.113.7')

    expect(response.body.requestIp).toBe('203.0.113.7')
  })

  it('answers the socket address without a proxy header', async () => {
    const { agent } = await signedIn(app)

    const response = await agent.get('/api/ice')

    expect(response.body.requestIp).toMatch(/^(127\.0\.0\.1|::1)$/)
  })

  it('asks for a session', async () => {
    expect((await request(app.getHttpServer()).get('/api/ice')).status).toBe(401)
  })
})
