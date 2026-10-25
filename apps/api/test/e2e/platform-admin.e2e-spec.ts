import { randomUUID } from 'node:crypto'
import type { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { PrismaService } from '../../src/lib/prisma'
import { makeCollected } from '../../src/modules/accounts/test/hardware-seed'
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

  it('shows the own limits, effective limits and counts of each user', async () => {
    const admin = await signedIn(app, { admin: true })
    const ana = await signedIn(app)
    await ana.agent.post('/api/servers').send({ name: 'Squad' })
    await admin.agent.put(`/api/admin/users/${ana.user.id}/limits`).send({ maxServers: 4 })

    const [row] = (await admin.agent.get('/api/admin/users').query({ search: ana.user.username })).body.users
    expect(row).toMatchObject({
      maxServersOverride: 4,
      effectiveMaxServers: 4,
      ownedServerCount: 1,
      sessionCount: 1,
    })
    const [plain] = (await admin.agent.get('/api/admin/users').query({ search: admin.user.username })).body.users
    expect(plain).toMatchObject({ maxServersOverride: null, ownedServerCount: 0, sessionCount: 1 })
    expect(plain.effectiveMaxServers).toBeGreaterThanOrEqual(1)

    await app
      .get(PrismaService)
      .session.updateMany({ where: { userId: ana.user.id }, data: { expiresAt: new Date(0) } })
    const [expired] = (await admin.agent.get('/api/admin/users').query({ search: ana.user.username })).body.users
    expect(expired.sessionCount).toBe(0)
  })

  it('ends one session only: its socket closes, the other session stays', async () => {
    const admin = await signedIn(app, { admin: true })
    const ana = await signedIn(app)
    const other = request.agent(app.getHttpServer())
    const secondLogin = await signIn(ana.user.email, PASSWORD)
    expect(secondLogin.status).toBe(200)
    const secondCookie = ([] as string[])
      .concat(secondLogin.headers['set-cookie'] ?? [])
      .map((line) => line.split(';')[0])
      .join('; ')
    const first = await connectSocket(app, ana.cookie)
    const second = await connectSocket(app, secondCookie)
    sockets.push(first, second)

    const sessions = (await admin.agent.get(`/api/admin/users/${ana.user.id}/sessions`)).body.sessions
    expect(sessions).toHaveLength(2)
    expect(sessions[0].lastActiveAt).toEqual(expect.any(String))
    const target = await app.get(PrismaService).session.findFirstOrThrow({
      where: { userId: ana.user.id },
      orderBy: { createdAt: 'asc' },
    })

    const revoked = nextEvent(first, 'session:revoked')
    const closed = new Promise((resolve) => first.once('disconnect', resolve))
    const url = `/api/admin/users/${ana.user.id}/sessions/${target.id}/revoke`
    expect((await admin.agent.post(url)).status).toBe(204)
    await Promise.all([revoked, closed])

    expect((await ana.agent.get('/api/me/profile')).status).toBe(401)
    expect(second.connected).toBe(true)
    expect((await other.get('/api/me/profile').set('Cookie', secondCookie)).status).toBe(200)
    expect((await admin.agent.get(`/api/admin/users/${ana.user.id}/sessions`)).body.sessions).toHaveLength(1)

    expect((await admin.agent.post(url)).status).toBe(404)
    expect((await admin.agent.post(`/api/admin/users/${admin.user.id}/sessions/${target.id}/revoke`)).status).toBe(404)
    expect((await admin.agent.post(`/api/admin/users/${randomUUID()}/sessions/${target.id}/revoke`)).status).toBe(404)
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

  it('shows the own and effective limits of each server', async () => {
    const admin = await signedIn(app, { admin: true })
    const { serverId } = await createServerWithMembers(app)
    const defaults = (await admin.agent.get('/api/admin/settings')).body

    const [plain] = (await admin.agent.get('/api/admin/servers')).body.servers
    expect(plain).toMatchObject({
      maxMembersOverride: null,
      maxRoomsOverride: null,
      effectiveMaxMembers: defaults.maxMembersPerServer,
      effectiveMaxRooms: defaults.maxRoomsPerServer,
    })

    await admin.agent.put(`/api/admin/servers/${serverId}/limits`).send({ maxMembers: 25, maxRooms: null })
    const expected = {
      maxMembersOverride: 25,
      maxRoomsOverride: null,
      effectiveMaxMembers: 25,
      effectiveMaxRooms: defaults.maxRoomsPerServer,
    }
    expect((await admin.agent.get('/api/admin/servers')).body.servers[0]).toMatchObject(expected)
    expect((await admin.agent.get(`/api/admin/servers/${serverId}`)).body).toMatchObject(expected)
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

  it('lists the devices of the whole base with their users, newest first, searchable', async () => {
    const admin = await signedIn(app, { admin: true })
    const ana = await signedIn(app)
    const bia = await signedIn(app)
    const [anaDevice, biaDevice] = [randomUUID(), randomUUID()]
    await ana.agent.post('/api/me/devices').send({ deviceId: anaDevice, collected: makeCollected() })
    await bia.agent.post('/api/me/devices').send({ deviceId: biaDevice, collected: makeCollected() })

    const all = await admin.agent.get('/api/admin/hardware/devices')
    expect(all.body).toMatchObject({ total: 2, page: 1, pageSize: 20 })
    expect(all.body.devices).toEqual([
      {
        user: { id: bia.user.id, username: bia.user.username },
        deviceId: biaDevice,
        collected: expect.objectContaining({ logicalCores: expect.any(Number) }),
        manual: null,
        collectedAt: expect.any(String),
      },
      expect.objectContaining({ user: { id: ana.user.id, username: ana.user.username }, deviceId: anaDevice }),
    ])

    const found = await admin.agent
      .get('/api/admin/hardware/devices')
      .query({ search: ana.user.username.toUpperCase(), pageSize: 1 })
    expect(found.body.total).toBe(1)
    expect(found.body.devices[0].deviceId).toBe(anaDevice)
    expect((await admin.agent.get('/api/admin/hardware/devices').query({ page: 2, pageSize: 1 })).body.devices).toEqual(
      [expect.objectContaining({ deviceId: anaDevice })],
    )
    expect((await ana.agent.get('/api/admin/hardware/devices')).status).toBe(403)
  })

  it('documents the admin routes in OpenAPI', async () => {
    const response = await request(app.getHttpServer()).get('/api/docs/openapi.json')

    expect(Object.keys(response.body.paths)).toEqual(
      expect.arrayContaining([
        '/api/admin/users',
        '/api/admin/users/{userId}/suspend',
        '/api/admin/servers/{serverId}',
        '/api/admin/users/{userId}/sessions/{sessionId}/revoke',
        '/api/admin/hardware/summary',
        '/api/admin/hardware/devices',
        '/api/me/limits',
      ]),
    )
  })
})
