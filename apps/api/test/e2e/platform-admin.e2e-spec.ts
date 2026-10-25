import { randomUUID } from 'node:crypto'
import type { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { PrismaService } from '../../src/lib/prisma'
import { makeCollected } from '../../src/modules/accounts/test/hardware'
import { createServerWithMembers } from '../factories/server.factory'
import { createTestApp } from '../support/create-test-app'
import { resetDatabase } from '../support/database'
import { signedIn } from '../support/signed-in'
import { connectSocket, nextEvent, type TestSocket } from '../support/socket-client'

// The password of every account made by signedIn (see makeSignUp).
const PASSWORD = 'correct-horse-battery'

describe('Platform admin panel (e2e)', () => {
  let app: INestApplication
  const sockets: TestSocket[] = []

  beforeAll(async () => {
    app = await createTestApp()
    await app.listen(0)
  })

  beforeEach(async () => {
    await resetDatabase(app.get(PrismaService))
  })

  afterEach(() => {
    for (const socket of sockets.splice(0)) socket.close()
  })

  afterAll(async () => {
    await app.close()
  })

  function signIn(email: string, password: string) {
    return request(app.getHttpServer()).post('/api/auth/sign-in/email').send({ email, password })
  }

  it('is only for the platform admin with two-factor', async () => {
    const user = await signedIn(app)
    const noTwoFactor = await signedIn(app, { admin: true, twoFactor: false })

    expect((await user.agent.get('/api/admin/users')).status).toBe(403)
    const blocked = await noTwoFactor.agent.get('/api/admin/servers')
    expect(blocked.status).toBe(403)
    expect(blocked.body.error.code).toBe('TWO_FACTOR_REQUIRED')
    expect((await request(app.getHttpServer()).get('/api/admin/hardware/summary')).status).toBe(401)
  })

  it('lists users with who is online, and their sessions', async () => {
    const admin = await signedIn(app, { admin: true })
    const ana = await signedIn(app)
    sockets.push(await connectSocket(app, ana.cookie))

    // Each sign-up key comes from an extra admin row (issueRegistrationKey), so
    // there are more users than the two signed in; the newest is Ana.
    const all = await admin.agent.get('/api/admin/users').query({ pageSize: 1 })
    expect(all.body).toMatchObject({ total: 4, page: 1, pageSize: 1 })
    expect(all.body.users).toEqual([expect.objectContaining({ id: ana.user.id, online: true, suspended: false })])

    const found = await admin.agent.get('/api/admin/users').query({ search: admin.user.username })
    expect(found.body.users).toEqual([expect.objectContaining({ id: admin.user.id, role: 'admin', online: false })])

    const sessions = await admin.agent.get(`/api/admin/users/${ana.user.id}/sessions`)
    expect(sessions.body.sessions).toEqual([
      expect.objectContaining({ id: expect.any(String), userAgent: expect.any(String) }),
    ])
    expect((await admin.agent.get(`/api/admin/users/${randomUUID()}/sessions`)).status).toBe(404)
  })

  it('suspends at once: socket closed, sessions gone, sign-in blocked until reactivated', async () => {
    const admin = await signedIn(app, { admin: true })
    const ana = await signedIn(app)
    const socket = await connectSocket(app, ana.cookie)
    sockets.push(socket)

    const revoked = nextEvent(socket, 'session:revoked')
    const closed = new Promise((resolve) => socket.once('disconnect', resolve))
    expect((await admin.agent.post(`/api/admin/users/${ana.user.id}/suspend`)).status).toBe(204)
    await Promise.all([revoked, closed])

    expect((await ana.agent.get('/api/me/profile')).status).toBe(401)
    expect((await signIn(ana.user.email, PASSWORD)).status).not.toBe(200)
    await expect(connectSocket(app, ana.cookie)).rejects.toThrow('UNAUTHENTICATED')
    const listed = await admin.agent.get('/api/admin/users').query({ search: ana.user.username })
    expect(listed.body.users[0].suspended).toBe(true)

    expect((await admin.agent.post(`/api/admin/users/${admin.user.id}/suspend`)).body.error.code).toBe(
      'CANNOT_SUSPEND_SELF',
    )
    expect((await admin.agent.post(`/api/admin/users/${ana.user.id}/reactivate`)).status).toBe(204)
    expect((await signIn(ana.user.email, PASSWORD)).status).toBe(200)
  })

  it('ends the sessions of a user on every device', async () => {
    const admin = await signedIn(app, { admin: true })
    const ana = await signedIn(app)
    const socket = await connectSocket(app, ana.cookie)
    sockets.push(socket)

    const revoked = nextEvent(socket, 'session:revoked')
    expect((await admin.agent.post(`/api/admin/users/${ana.user.id}/sessions/revoke`)).status).toBe(204)
    await revoked
    expect((await ana.agent.get('/api/me/profile')).status).toBe(401)
    expect((await signIn(ana.user.email, PASSWORD)).status).toBe(200)
  })

  it('resets a password typed by the admin or generated', async () => {
    const admin = await signedIn(app, { admin: true })
    const ana = await signedIn(app)

    const typed = await admin.agent.post(`/api/admin/users/${ana.user.id}/password`).send({ password: 'new-pass-1234' })
    expect(typed.body).toEqual({ password: 'new-pass-1234' })
    expect((await ana.agent.get('/api/me/profile')).status).toBe(401)
    expect((await signIn(ana.user.email, PASSWORD)).status).not.toBe(200)
    expect((await signIn(ana.user.email, 'new-pass-1234')).status).toBe(200)

    const generated = await admin.agent.post(`/api/admin/users/${ana.user.id}/password`).send({})
    expect(generated.body.password).toHaveLength(16)
    expect((await signIn(ana.user.email, generated.body.password)).status).toBe(200)

    const tooShort = await admin.agent.post(`/api/admin/users/${ana.user.id}/password`).send({ password: 'short' })
    expect(tooShort.status).toBe(400)
  })

  it('lists, details and deletes any server, notifying its owner', async () => {
    const admin = await signedIn(app, { admin: true })
    const { owner, members, serverId, roomIds } = await createServerWithMembers(app)

    const listed = await admin.agent.get('/api/admin/servers')
    expect(listed.body).toMatchObject({ total: 1 })
    expect(listed.body.servers).toEqual([
      expect.objectContaining({
        id: serverId,
        owner: { id: owner.user.id, username: owner.user.username },
        memberCount: 2,
        roomCount: 1,
      }),
    ])

    const detail = await admin.agent.get(`/api/admin/servers/${serverId}`)
    expect(detail.body.rooms.map((room: { id: string }) => room.id)).toEqual(roomIds)
    expect(detail.body.members.map((member: { role: string }) => member.role)).toEqual(['owner', 'member'])
    expect(detail.body.members[1].invite.createdBy.id).toBe(owner.user.id)

    expect((await admin.agent.delete(`/api/admin/servers/${serverId}`)).status).toBe(204)
    expect((await admin.agent.delete(`/api/admin/servers/${serverId}`)).status).toBe(404)
    for (const person of [owner, members[0]]) {
      const notices = (await person.agent.get('/api/me/notifications')).body.notifications
      expect(notices.map((notice: { type: string }) => notice.type)).toEqual(['server-deleted'])
    }
  })

  it('shows the devices of a user and the summary of the base', async () => {
    const admin = await signedIn(app, { admin: true })
    const ana = await signedIn(app)
    const deviceId = randomUUID()
    await ana.agent.post('/api/me/devices').send({ deviceId, collected: makeCollected({ logicalCores: 4 }) })

    const devices = await admin.agent.get(`/api/admin/users/${ana.user.id}/devices`)
    expect(devices.body.devices).toEqual([expect.objectContaining({ deviceId })])
    expect((await admin.agent.get('/api/admin/hardware/summary')).body).toEqual({
      devices: 1,
      minLogicalCores: 4,
      minDeviceMemoryGb: 8,
      hardwareAccelerationPercent: 100,
      h264HardwarePercent: 100,
    })
  })

  it('documents the admin routes in OpenAPI', async () => {
    const response = await request(app.getHttpServer()).get('/api/docs/openapi.json')

    expect(Object.keys(response.body.paths)).toEqual(
      expect.arrayContaining([
        '/api/admin/users',
        '/api/admin/users/{userId}/suspend',
        '/api/admin/servers/{serverId}',
        '/api/admin/hardware/summary',
      ]),
    )
  })
})
