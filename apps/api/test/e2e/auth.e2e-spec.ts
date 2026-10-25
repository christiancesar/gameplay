import { Controller, Get, Module } from '@nestjs/common'
import type { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { CurrentUser } from '../../src/common/auth/current-user.decorator'
import { PlatformAdmin } from '../../src/common/auth/platform-admin.decorator'
import type { AuthUser } from '../../src/lib/auth'
import { DISABLED_AUTH_PATHS } from '../../src/lib/auth-disabled-paths'
import { PrismaService } from '../../src/lib/prisma'
import { issueRegistrationKey } from '../factories/registration-invite.factory'
import { makeSignUp } from '../factories/user.factory'
import { resetDatabase } from '../support/database'
import { createTestApp } from '../support/create-test-app'

@Controller('auth-test')
class AuthTestController {
  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return { username: user.username }
  }

  @Get('admin')
  @PlatformAdmin()
  admin() {
    return { ok: true }
  }
}

@Module({ controllers: [AuthTestController] })
class AuthTestModule {}

describe('Authentication (e2e)', () => {
  let app: INestApplication
  let prisma: PrismaService

  beforeAll(async () => {
    app = await createTestApp({ imports: [AuthTestModule] })
    prisma = app.get(PrismaService)
  })

  beforeEach(async () => {
    await resetDatabase(prisma)
  })

  afterAll(async () => {
    await app.close()
  })

  async function signUp(overrides = {}) {
    const { key } = await issueRegistrationKey(app)
    const body = makeSignUp({ registrationKey: key, ...overrides })
    const agent = request.agent(app.getHttpServer())
    const response = await agent.post('/api/auth/sign-up/email').send(body)
    return { agent, response, body }
  }

  it('signs up with username and registration key, and keeps the session cookie', async () => {
    const { agent, response, body } = await signUp()

    expect(response.status).toBe(200)
    expect(String(response.headers['set-cookie'])).toContain('gameplay.session_token')

    const me = await agent.get('/api/auth-test/me')
    expect(me.status).toBe(200)
    expect(me.body).toEqual({ username: body.username.toLowerCase() })
  })

  it('refuses a sign-up without a registration key', async () => {
    const { response, body } = await signUp({ registrationKey: '' })

    expect(response.status).toBe(400)
    expect(await prisma.user.count({ where: { email: body.email } })).toBe(0)
  })

  it('refuses a username outside the rules', async () => {
    const { response } = await signUp({ username: 'a b' })

    expect(response.status).toBe(400)
  })

  it('signs in by email and by username', async () => {
    const { body } = await signUp()
    const server = app.getHttpServer()

    const byEmail = await request(server)
      .post('/api/auth/sign-in/email')
      .send({ email: body.email, password: body.password })
    const byUsername = await request(server)
      .post('/api/auth/sign-in/username')
      .send({ username: body.username, password: body.password })

    expect(byEmail.status).toBe(200)
    expect(byUsername.status).toBe(200)
  })

  it('rejects a wrong password', async () => {
    const { body } = await signUp()

    const response = await request(app.getHttpServer())
      .post('/api/auth/sign-in/email')
      .send({ email: body.email, password: 'wrong-password' })

    expect(response.status).toBe(401)
  })

  it('answers 401 in the error contract when there is no session', async () => {
    const response = await request(app.getHttpServer()).get('/api/auth-test/me')

    expect(response.status).toBe(401)
    expect(response.body.error.code).toBe('UNAUTHORIZED')
  })

  it('ends the session on sign-out', async () => {
    const { agent } = await signUp()

    await agent.post('/api/auth/sign-out').send({})

    expect((await agent.get('/api/auth-test/me')).status).toBe(401)
  })

  it('keeps a suspended user out', async () => {
    const { body } = await signUp()
    await prisma.user.updateMany({ where: { email: body.email }, data: { banned: true } })

    const response = await request(app.getHttpServer())
      .post('/api/auth/sign-in/email')
      .send({ email: body.email, password: body.password })

    expect(response.status).toBe(403)
  })

  describe('platform admin routes', () => {
    it('refuse a regular user', async () => {
      const { agent } = await signUp()

      expect((await agent.get('/api/auth-test/admin')).status).toBe(403)
    })

    it('refuse an admin without two-factor', async () => {
      const { agent, body } = await signUp()
      await prisma.user.updateMany({ where: { email: body.email }, data: { role: 'admin' } })

      const response = await agent.get('/api/auth-test/admin')

      expect(response.status).toBe(403)
      expect(response.body.error.code).toBe('TWO_FACTOR_REQUIRED')
    })

    it('let an admin with two-factor in', async () => {
      const { agent, body } = await signUp()
      await prisma.user.updateMany({ where: { email: body.email }, data: { role: 'admin', twoFactorEnabled: true } })

      expect((await agent.get('/api/auth-test/admin')).status).toBe(200)
    })
  })

  describe('disabled routes', () => {
    it.each(DISABLED_AUTH_PATHS)('answer 404 on %s', async (path) => {
      const { agent } = await signUp()

      // Both methods, so a GET route doesn't pass just for being called with POST.
      expect((await agent.get(`/api/auth${path}`)).status).toBe(404)
      expect((await agent.post(`/api/auth${path}`).send({})).status).toBe(404)
    })

    it.each(['/reset-password/some-token', '/callback/github'])('answer 404 on %s', async (path) => {
      expect((await request(app.getHttpServer()).get(`/api/auth${path}`)).status).toBe(404)
    })
  })

  describe('update-user', () => {
    it('changes the username', async () => {
      const { agent } = await signUp()

      const response = await agent.post('/api/auth/update-user').send({ username: 'renamed_01' })

      expect(response.status).toBe(200)
      expect((await agent.get('/api/auth-test/me')).body).toEqual({ username: 'renamed_01' })
    })

    it('refuses an image URL', async () => {
      const { agent, body } = await signUp()

      const response = await agent.post('/api/auth/update-user').send({ image: 'https://example.com/a.png' })

      expect(response.status).toBe(400)
      const user = await prisma.user.findUniqueOrThrow({ where: { email: body.email } })
      expect(user.image).toBeNull()
    })
  })
})
