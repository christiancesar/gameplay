import type { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { PrismaService } from '../../src/lib/prisma'
import { EffectiveLimitsService } from '../../src/modules/limits/services/effective-limits.service'
import { resetDatabase } from '../support/database'
import { createTestApp } from '../support/create-test-app'
import { signedIn } from '../support/signed-in'

const defaults = { maxServersPerUser: 1, maxMembersPerServer: 10, maxRoomsPerServer: 2, minChromiumVersion: 130 }

describe('Limits and platform settings (e2e)', () => {
  let app: INestApplication
  let prisma: PrismaService

  beforeAll(async () => {
    app = await createTestApp()
    prisma = app.get(PrismaService)
  })

  beforeEach(async () => {
    await resetDatabase(prisma)
  })

  afterAll(async () => {
    await app.close()
  })

  function effectiveServers(userId: string) {
    return app.get(EffectiveLimitsService).resolve({ kind: 'serversPerUser', userId })
  }

  it('starts with the defaults', async () => {
    const { agent } = await signedIn(app, { admin: true })

    const response = await agent.get('/api/admin/settings')

    expect(response.status).toBe(200)
    expect(response.body).toEqual(defaults)
  })

  it('applies a new default without a restart', async () => {
    const { agent } = await signedIn(app, { admin: true })
    const { user } = await signedIn(app)

    const response = await agent.put('/api/admin/settings').send({ ...defaults, maxServersPerUser: 3 })

    expect(response.status).toBe(200)
    expect(response.body.maxServersPerUser).toBe(3)
    expect(await effectiveServers(user.id)).toBe(3)
  })

  it('gives the user override precedence, and goes back to the default when cleared', async () => {
    const { agent } = await signedIn(app, { admin: true })
    const { user } = await signedIn(app)

    expect((await agent.put(`/api/admin/users/${user.id}/limits`).send({ maxServers: 5 })).status).toBe(204)
    expect(await effectiveServers(user.id)).toBe(5)

    await agent.put(`/api/admin/users/${user.id}/limits`).send({ maxServers: null })
    expect(await effectiveServers(user.id)).toBe(defaults.maxServersPerUser)
  })

  it('tells the user the server limit in force and how many they own', async () => {
    const { agent } = await signedIn(app, { admin: true })
    const ana = await signedIn(app)

    expect((await ana.agent.get('/api/me/limits')).body).toEqual({
      maxServers: defaults.maxServersPerUser,
      ownedServers: 0,
    })

    await agent.put(`/api/admin/users/${ana.user.id}/limits`).send({ maxServers: 5 })
    await ana.agent.post('/api/servers').send({ name: 'Squad' })

    expect((await ana.agent.get('/api/me/limits')).body).toEqual({ maxServers: 5, ownedServers: 1 })
    expect((await request(app.getHttpServer()).get('/api/me/limits')).status).toBe(401)
  })

  it('answers 404 for the override of an unknown user', async () => {
    const { agent } = await signedIn(app, { admin: true })

    const response = await agent.put('/api/admin/users/missing/limits').send({ maxServers: 2 })

    expect(response.status).toBe(404)
    expect(response.body.error.code).toBe('USER_NOT_FOUND')
  })

  it.each([
    ['a zero default', { ...defaults, maxRoomsPerServer: 0 }],
    ['a missing field', { maxServersPerUser: 1 }],
    ['a fraction', { ...defaults, maxMembersPerServer: 2.5 }],
  ])('refuses %s', async (_case, body) => {
    const { agent } = await signedIn(app, { admin: true })

    expect((await agent.put('/api/admin/settings').send(body)).status).toBe(400)
  })

  it('refuses a regular user', async () => {
    const { agent, user } = await signedIn(app)

    expect((await agent.get('/api/admin/settings')).status).toBe(403)
    expect((await agent.put(`/api/admin/users/${user.id}/limits`).send({ maxServers: 9 })).status).toBe(403)
  })

  it('serves the minimum Chromium version without a session', async () => {
    const response = await request(app.getHttpServer()).get('/api/settings/public')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ minChromiumVersion: 130 })
  })
})
