import type { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { PrismaService } from '../../src/lib/prisma'
import { issueRegistrationKey } from '../factories/registration-invite.factory'
import { makeSignUp } from '../factories/user.factory'
import { resetDatabase } from '../support/database'
import { createTestApp } from '../support/create-test-app'

describe('Registration invites (e2e)', () => {
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

  function signUp(overrides: Record<string, string>) {
    const body = makeSignUp(overrides)
    const agent = request.agent(app.getHttpServer())
    return { agent, body, response: agent.post('/api/auth/sign-up/email').send(body) }
  }

  // Signed-in agent; role and two-factor are set straight in the database.
  async function signedIn({ admin = false, twoFactor = true } = {}) {
    const { key } = await issueRegistrationKey(app)
    const { agent, body, response } = signUp({ registrationKey: key })
    expect((await response).status).toBe(200)
    if (admin) {
      await prisma.user.updateMany({
        where: { email: body.email },
        data: { role: 'admin', twoFactorEnabled: twoFactor },
      })
    }
    return agent
  }

  describe('admin routes', () => {
    it('generate a key shown once, then list only its suffix', async () => {
      const admin = await signedIn({ admin: true })

      const generated = await admin.post('/api/admin/registration-invites').send({ validity: '7d' })

      expect(generated.status).toBe(201)
      expect(generated.body.key).toMatch(/^[2-9A-HJ-NP-Z]{6}$/)
      expect(generated.body.invite).toMatchObject({ suffix: generated.body.key.slice(-3), status: 'active' })

      const list = await admin.get('/api/admin/registration-invites')
      expect(list.status).toBe(200)
      const listed = list.body.invites.find((invite: { id: string }) => invite.id === generated.body.invite.id)
      expect(listed).toEqual(generated.body.invite)
      expect(JSON.stringify(list.body)).not.toContain(generated.body.key)
    })

    it('show who used a key', async () => {
      const admin = await signedIn({ admin: true })
      const { body: generated } = await admin.post('/api/admin/registration-invites').send({ validity: '1d' })
      const { body, response } = signUp({ registrationKey: generated.key })
      expect((await response).status).toBe(200)

      const list = await admin.get('/api/admin/registration-invites')
      const listed = list.body.invites.find((invite: { id: string }) => invite.id === generated.invite.id)

      expect(listed).toMatchObject({ status: 'used', usedBy: { username: body.username.toLowerCase() } })
    })

    it('revoke a key', async () => {
      const admin = await signedIn({ admin: true })
      const { body: generated } = await admin.post('/api/admin/registration-invites').send({ validity: '1d' })

      const revoked = await admin.post(`/api/admin/registration-invites/${generated.invite.id}/revoke`)

      expect(revoked.status).toBe(204)
      const list = await admin.get('/api/admin/registration-invites')
      expect(list.body.invites[0]).toMatchObject({ id: generated.invite.id, status: 'revoked' })
    })

    it('answer 404 when revoking an unknown key', async () => {
      const admin = await signedIn({ admin: true })

      const response = await admin.post('/api/admin/registration-invites/missing/revoke')

      expect(response.status).toBe(404)
      expect(response.body.error.code).toBe('REGISTRATION_INVITE_NOT_FOUND')
    })

    it('refuse an invalid validity', async () => {
      const admin = await signedIn({ admin: true })

      const response = await admin.post('/api/admin/registration-invites').send({ validity: '2d' })

      expect(response.status).toBe(400)
    })

    it('refuse a regular user and an admin without two-factor', async () => {
      const user = await signedIn()
      const adminWithout2fa = await signedIn({ admin: true, twoFactor: false })

      expect((await user.get('/api/admin/registration-invites')).status).toBe(403)
      expect((await adminWithout2fa.get('/api/admin/registration-invites')).status).toBe(403)
    })
  })

  describe('sign-up', () => {
    it('passes with a valid key, in any case', async () => {
      const { key } = await issueRegistrationKey(app)

      const { response } = signUp({ registrationKey: key.toLowerCase() })

      expect((await response).status).toBe(200)
    })

    it('refuses an unknown key', async () => {
      const { response } = signUp({ registrationKey: 'ZZZ999' })
      const res = await response

      expect(res.status).toBe(400)
      expect(res.body.code).toBe('INVALID_REGISTRATION_KEY')
    })

    it('refuses an expired key', async () => {
      const { key, invite } = await issueRegistrationKey(app)
      await prisma.registrationInvite.update({ where: { id: invite.id }, data: { expiresAt: new Date() } })

      const { response } = signUp({ registrationKey: key })

      expect((await response).status).toBe(400)
    })

    it('refuses a revoked key', async () => {
      const { key, invite } = await issueRegistrationKey(app)
      await prisma.registrationInvite.update({ where: { id: invite.id }, data: { revokedAt: new Date() } })

      const { response } = signUp({ registrationKey: key })

      expect((await response).status).toBe(400)
    })

    it('refuses a key that was already used', async () => {
      const { key } = await issueRegistrationKey(app)
      expect((await signUp({ registrationKey: key }).response).status).toBe(200)

      const { response, body } = signUp({ registrationKey: key })

      expect((await response).status).toBe(400)
      expect(await prisma.user.count({ where: { email: body.email } })).toBe(0)
    })

    it('lets only one of two concurrent sign-ups use the key', async () => {
      const { key } = await issueRegistrationKey(app)

      const responses = await Promise.all([
        signUp({ registrationKey: key }).response,
        signUp({ registrationKey: key }).response,
      ])

      expect(responses.map((response) => response.status).sort((a, b) => a - b)).toEqual([200, 400])
    })

    it('gives the key back when the sign-up fails after taking it', async () => {
      const { key } = await issueRegistrationKey(app)
      const first = signUp({ registrationKey: key })
      expect((await first.response).status).toBe(200)
      const { key: secondKey, invite } = await issueRegistrationKey(app)

      // Same email: Better Auth refuses it after the hook took the key.
      const failed = signUp({ registrationKey: secondKey, email: first.body.email })
      expect((await failed.response).status).toBe(422)

      const stored = await prisma.registrationInvite.findUniqueOrThrow({ where: { id: invite.id } })
      expect(stored.usedAt).toBeNull()
      expect((await signUp({ registrationKey: secondKey }).response).status).toBe(200)
    })
  })
})
