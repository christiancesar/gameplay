import { Injectable, Module } from '@nestjs/common'
import type { INestApplication } from '@nestjs/common'
import sharp from 'sharp'
import request from 'supertest'
import { OnDomainEvent } from '../../src/common/events/domain-event-bus'
import type { DomainEvents } from '../../src/common/events/domain-events'
import { PrismaService } from '../../src/lib/prisma'
import { InMemoryStorageProvider } from '../../src/modules/storage/drivers/in-memory-storage.provider'
import { StorageProvider } from '../../src/modules/storage/storage.provider'
import { createTestApp } from '../support/create-test-app'
import { resetDatabase } from '../support/database'
import { signedIn } from '../support/signed-in'

@Injectable()
class FakeListener {
  readonly deleted: DomainEvents['server.deleted'][] = []
  readonly roomChanges: DomainEvents['room.changed'][] = []

  @OnDomainEvent('server.deleted')
  onDeleted(payload: DomainEvents['server.deleted']) {
    this.deleted.push(payload)
  }

  @OnDomainEvent('room.changed')
  onRoomChanged(payload: DomainEvents['room.changed']) {
    this.roomChanges.push(payload)
  }
}

@Module({ providers: [FakeListener] })
class FakeListenerModule {}

function png(color: string) {
  return sharp({ create: { width: 600, height: 400, channels: 3, background: color } })
    .png()
    .toBuffer()
}

describe('Servers and rooms (e2e)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let listener: FakeListener
  const storage = new InMemoryStorageProvider()

  beforeAll(async () => {
    app = await createTestApp({
      imports: [FakeListenerModule],
      override: (builder) => builder.overrideProvider(StorageProvider).useValue(storage),
    })
    prisma = app.get(PrismaService)
    listener = app.get(FakeListener)
  })

  beforeEach(async () => {
    await resetDatabase(prisma)
    storage.files.clear()
    listener.deleted.length = 0
    listener.roomChanges.length = 0
  })

  afterAll(async () => {
    await app.close()
  })

  // Membership through invites comes in BE-10; here it goes straight in.
  async function joinAs(serverId: string, role: 'ADMIN' | 'MEMBER') {
    const session = await signedIn(app)
    await prisma.serverMember.create({ data: { serverId, userId: session.user.id, role } })
    return session
  }

  async function createServer() {
    const owner = await signedIn(app)
    const response = await owner.agent.post('/api/servers').send({ name: 'Squad', defaultRoomName: 'Sala 1' })
    expect(response.status).toBe(201)
    return { owner, server: response.body }
  }

  it('runs the whole flow: create, edit, icon, rooms up to the limit, delete', async () => {
    const { owner, server } = await createServer()
    const admin = await joinAs(server.id, 'ADMIN')
    expect(server).toMatchObject({ role: 'owner', memberCount: 1, limits: { maxMembers: 10, maxRooms: 2 } })
    expect(server.rooms).toEqual([{ id: expect.any(String), name: 'Sala 1', position: 0 }])

    const edited = await admin.agent.patch(`/api/servers/${server.id}`).send({ name: 'Squad 2', description: '' })
    expect(edited.body).toMatchObject({ name: 'Squad 2', description: null, role: 'admin', memberCount: 2 })

    const auto = await admin.agent.put(`/api/servers/${server.id}/auto-approve`).send({ autoApprove: true })
    expect(auto.body.autoApprove).toBe(true)

    const icon = await admin.agent.put(`/api/servers/${server.id}/icon`).attach('file', await png('#f00'), 'i.png')
    expect(icon.status).toBe(200)
    expect(icon.body.url).toMatch(/^\/uploads\/icons\/.+\.webp$/)

    const room = await admin.agent.post(`/api/servers/${server.id}/rooms`).send({ name: 'Games' })
    expect(room.status).toBe(201)
    const full = await admin.agent.post(`/api/servers/${server.id}/rooms`).send({ name: 'Third' })
    expect(full.status).toBe(409)
    expect(full.body.error.code).toBe('ROOM_LIMIT_REACHED')

    const reordered = await admin.agent
      .put(`/api/servers/${server.id}/rooms/order`)
      .send({ roomIds: [room.body.id, server.rooms[0].id] })
    expect(reordered.body.rooms.map((r: { name: string }) => r.name)).toEqual(['Games', 'Sala 1'])

    const list = await owner.agent.get('/api/servers')
    expect(list.body.servers).toEqual([{ id: server.id, name: 'Squad 2', iconUrl: icon.body.url, role: 'owner' }])

    expect((await admin.agent.delete(`/api/servers/${server.id}`)).status).toBe(403)
    expect((await owner.agent.delete(`/api/servers/${server.id}`)).status).toBe(204)

    expect(await prisma.server.count()).toBe(0)
    expect(await prisma.serverMember.count()).toBe(0)
    expect(await prisma.room.count()).toBe(0)
    expect(storage.files.size).toBe(0)
    expect(listener.deleted).toEqual([
      {
        serverId: server.id,
        serverName: 'Squad 2',
        memberIds: expect.arrayContaining([owner.user.id, admin.user.id]),
        deletedById: owner.user.id,
      },
    ])
    expect(listener.roomChanges).toHaveLength(2)
  })

  it('stops at one server per user by default and follows the override', async () => {
    const { owner } = await createServer()

    const second = await owner.agent.post('/api/servers').send({ name: 'Second' })
    expect(second.status).toBe(409)
    expect(second.body.error.code).toBe('SERVER_LIMIT_REACHED')

    await prisma.user.update({ where: { id: owner.user.id }, data: { maxServersOverride: 2 } })
    expect((await owner.agent.post('/api/servers').send({ name: 'Second' })).status).toBe(201)
  })

  it('creates one server when the same user sends two at once', async () => {
    const owner = await signedIn(app)

    const responses = await Promise.all([
      owner.agent.post('/api/servers').send({ name: 'A' }),
      owner.agent.post('/api/servers').send({ name: 'B' }),
    ])

    expect(responses.map((r) => r.status).sort((a, b) => a - b)).toEqual([201, 409])
    expect(await prisma.server.count()).toBe(1)
  })

  it('applies the room override set by the platform admin', async () => {
    const { owner, server } = await createServer()
    const platformAdmin = await signedIn(app, { admin: true })

    const set = await platformAdmin.agent
      .put(`/api/admin/servers/${server.id}/limits`)
      .send({ maxMembers: 20, maxRooms: 3 })
    expect(set.status).toBe(204)

    const detail = await owner.agent.get(`/api/servers/${server.id}`)
    expect(detail.body.limits).toEqual({ maxMembers: 20, maxRooms: 3 })
    const missing = await platformAdmin.agent
      .put('/api/admin/servers/missing/limits')
      .send({ maxMembers: null, maxRooms: null })
    expect(missing.status).toBe(404)
  })

  it('lets a member see but not change the server', async () => {
    const { server } = await createServer()
    const member = await joinAs(server.id, 'MEMBER')

    expect((await member.agent.get(`/api/servers/${server.id}`)).body.role).toBe('member')
    const denied = await member.agent.patch(`/api/servers/${server.id}`).send({ name: 'x' })
    expect(denied.status).toBe(403)
    expect(denied.body.error.code).toBe('SERVER_PERMISSION_DENIED')
    expect((await member.agent.post(`/api/servers/${server.id}/rooms`).send({ name: 'x' })).status).toBe(403)
    expect((await member.agent.delete(`/api/servers/${server.id}/icon`)).status).toBe(403)
  })

  it('answers 404 to someone outside the server', async () => {
    const { server } = await createServer()
    const stranger = await signedIn(app)

    const response = await stranger.agent.get(`/api/servers/${server.id}`)

    expect(response.status).toBe(404)
    expect(response.body.error.code).toBe('SERVER_NOT_FOUND')
  })

  it.each([
    ['an empty name', { name: '  ' }],
    ['a name over 40 characters', { name: 'x'.repeat(41) }],
  ])('refuses %s', async (_case, body) => {
    const owner = await signedIn(app)

    expect((await owner.agent.post('/api/servers').send(body)).status).toBe(400)
  })

  it('refuses a repeated room name', async () => {
    const { owner, server } = await createServer()

    const response = await owner.agent.post(`/api/servers/${server.id}/rooms`).send({ name: 'sala 1' })

    expect(response.status).toBe(409)
    expect(response.body.error.code).toBe('ROOM_NAME_TAKEN')
  })

  it('documents the routes', async () => {
    const response = await request(app.getHttpServer()).get('/api/docs/openapi.json')

    expect(Object.keys(response.body.paths)).toEqual(
      expect.arrayContaining([
        '/api/servers',
        '/api/servers/{serverId}',
        '/api/servers/{serverId}/icon',
        '/api/servers/{serverId}/cover',
        '/api/servers/{serverId}/rooms/order',
        '/api/admin/servers/{serverId}/limits',
      ]),
    )
  })
})
