import type { INestApplication } from '@nestjs/common'
import sharp from 'sharp'
import request from 'supertest'
import { PrismaService } from '../../src/lib/prisma'
import { makeCollected, makeManual } from '../../src/modules/accounts/test/hardware-seed'
import { InMemoryStorageProvider } from '../../src/modules/storage/providers/storage/in-memory/in-memory.storage.provider'
import { StorageProvider } from '../../src/modules/storage/providers/storage/storage.provider'
import { createTestApp } from '../support/create-test-app'
import { resetDatabase } from '../support/database'
import { signedIn } from '../support/signed-in'

const DEVICE = '6f1c2a52-8a3b-4d0e-9a39-0d8e6c1f2b10'

function png(color: string) {
  return sharp({ create: { width: 400, height: 300, channels: 3, background: color } })
    .png()
    .toBuffer()
}

describe('Account (e2e)', () => {
  let app: INestApplication
  let prisma: PrismaService
  const storage = new InMemoryStorageProvider()

  beforeAll(async () => {
    app = await createTestApp({
      override: (builder) => builder.overrideProvider(StorageProvider).useValue(storage),
    })
    prisma = app.get(PrismaService)
  })

  beforeEach(async () => {
    await resetDatabase(prisma)
    storage.files.clear()
  })

  afterAll(async () => {
    await app.close()
  })

  describe('profile and preferences', () => {
    it('returns the profile with the defaults', async () => {
      const { agent, user } = await signedIn(app)

      const response = await agent.get('/api/me/profile')

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        id: user.id,
        email: user.email,
        username: user.username,
        displayUsername: user.displayUsername,
        image: null,
        theme: 'dark',
        locale: null,
      })
    })

    it('remembers theme and language', async () => {
      const { agent } = await signedIn(app)

      const response = await agent.patch('/api/me/preferences').send({ theme: 'light', locale: 'pt' })

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({ theme: 'light', locale: 'pt' })
      expect((await agent.get('/api/me/profile')).body).toMatchObject({ theme: 'light', locale: 'pt' })
    })

    it.each([
      ['an unknown theme', { theme: 'blue' }],
      ['an unknown language', { locale: 'es' }],
    ])('refuses %s', async (_case, body) => {
      const { agent } = await signedIn(app)

      expect((await agent.patch('/api/me/preferences').send(body)).status).toBe(400)
    })

    it('asks for a session', async () => {
      expect((await request(app.getHttpServer()).get('/api/me/profile')).status).toBe(401)
    })
  })

  describe('avatar', () => {
    it('uploads, shows up in the session and replaces the old file', async () => {
      const { agent } = await signedIn(app)

      const first = await agent.put('/api/me/avatar').attach('file', await png('#ff0000'), 'me.png')
      expect(first.status).toBe(200)
      expect(first.body.image).toMatch(/^\/uploads\/avatars\/.+\.webp$/)

      const session = await agent.get('/api/auth/get-session')
      expect(session.body.user.image).toBe(first.body.image)

      const second = await agent.put('/api/me/avatar').attach('file', await png('#00ff00'), 'me.png')
      expect(second.body.image).not.toBe(first.body.image)
      expect([...storage.files.keys()]).toEqual([second.body.image.replace('/uploads/', '')])
    })

    it('removes the avatar', async () => {
      const { agent } = await signedIn(app)
      await agent.put('/api/me/avatar').attach('file', await png('#ff0000'), 'me.png')

      expect((await agent.delete('/api/me/avatar')).status).toBe(204)

      expect((await agent.get('/api/me/profile')).body.image).toBeNull()
      expect(storage.files.size).toBe(0)
    })

    it('refuses a file that is not an image', async () => {
      const { agent } = await signedIn(app)

      const response = await agent.put('/api/me/avatar').attach('file', Buffer.from('%PDF-1.7'), 'me.png')

      expect(response.status).toBe(415)
      expect((await agent.get('/api/me/profile')).body.image).toBeNull()
    })
  })

  describe('devices', () => {
    it('keeps one report per device and the manual info across collections', async () => {
      const { agent } = await signedIn(app)

      const created = await agent.post('/api/me/devices').send({ deviceId: DEVICE, collected: makeCollected() })
      expect(created.status).toBe(200)
      expect(created.body.manual).toBeNull()

      const manual = await agent.put(`/api/me/devices/${DEVICE}/manual`).send(makeManual())
      expect(manual.status).toBe(200)

      const recollected = await agent
        .post('/api/me/devices')
        .send({ deviceId: DEVICE, collected: makeCollected({ logicalCores: 4, deviceMemoryGb: 32 }) })
      expect(recollected.body).toMatchObject({ id: created.body.id, manual: makeManual() })
      expect(recollected.body.collected).toMatchObject({ logicalCores: 4, deviceMemoryGb: 8 })

      const list = await agent.get('/api/me/devices')
      expect(list.body.devices).toHaveLength(1)
    })

    it("doesn't show another user's devices", async () => {
      const { agent } = await signedIn(app)
      const other = await signedIn(app)
      await other.agent.post('/api/me/devices').send({ deviceId: DEVICE, collected: makeCollected() })

      expect((await agent.get('/api/me/devices')).body.devices).toEqual([])
      const manual = await agent.put(`/api/me/devices/${DEVICE}/manual`).send(makeManual())
      expect(manual.status).toBe(404)
      expect(manual.body.error.code).toBe('DEVICE_NOT_FOUND')
    })

    it('refuses an invalid report', async () => {
      const { agent } = await signedIn(app)

      const response = await agent.post('/api/me/devices').send({ deviceId: 'not-a-uuid', collected: {} })

      expect(response.status).toBe(400)
    })
  })

  it('documents the routes', async () => {
    const response = await request(app.getHttpServer()).get('/api/docs/openapi.json')

    expect(Object.keys(response.body.paths)).toEqual(
      expect.arrayContaining(['/api/me/profile', '/api/me/preferences', '/api/me/avatar', '/api/me/devices']),
    )
  })
})
