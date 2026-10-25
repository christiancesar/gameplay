import type { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { DomainEventBus } from '../../src/common/events/domain-event-bus'
import { PrismaService } from '../../src/lib/prisma'
import { PresenceStore } from '../../src/modules/realtime/stores/presence.store'
import { createServerWithMembers } from '../factories/server.factory'
import { createTestApp } from '../support/create-test-app'
import { resetDatabase } from '../support/database'
import { signedIn } from '../support/signed-in'
import { connectSocket, nextEvent, type TestSocket } from '../support/socket-client'

describe('Realtime gateway (e2e)', () => {
  let app: INestApplication
  let prisma: PrismaService
  const sockets: TestSocket[] = []

  beforeAll(async () => {
    app = await createTestApp()
    await app.listen(0)
    prisma = app.get(PrismaService)
  })

  beforeEach(async () => {
    await resetDatabase(prisma)
  })

  afterEach(() => {
    for (const socket of sockets.splice(0)) socket.close()
  })

  afterAll(async () => {
    await app.close()
  })

  async function connect(cookie?: string) {
    const socket = await connectSocket(app, cookie)
    sockets.push(socket)
    return socket
  }

  // Owner and Ana, both members of the same server.
  async function serverWithMember() {
    const { owner, members, serverId } = await createServerWithMembers(app)
    return { owner, ana: members[0], serverId }
  }

  async function subscribed(cookie: string, serverId: string) {
    const socket = await connect(cookie)
    const snapshot = nextEvent(socket, 'presence:snapshot')
    expect(await socket.emitWithAck('server:subscribe', { serverId })).toEqual({ ok: true })
    return { socket, snapshot: await snapshot }
  }

  it('refuses a connection without a valid session', async () => {
    await expect(connectSocket(app)).rejects.toThrow('UNAUTHENTICATED')
    await expect(connectSocket(app, 'gameplay.session_token=forged')).rejects.toThrow('UNAUTHENTICATED')
  })

  it('shows two members each other online and offline', async () => {
    const { owner, ana, serverId } = await serverWithMember()
    const ownerSide = await subscribed(owner.cookie, serverId)
    expect(ownerSide.snapshot).toEqual({ serverId, onlineUserIds: [owner.user.id], rooms: [] })

    const anaOnline = nextEvent(ownerSide.socket, 'presence:update')
    const anaSide = await subscribed(ana.cookie, serverId)
    expect(await anaOnline).toEqual({ serverId, userId: ana.user.id, online: true })
    expect(anaSide.snapshot.onlineUserIds.toSorted()).toEqual([owner.user.id, ana.user.id].toSorted())
    expect(await app.get(PresenceStore).isOnline(ana.user.id)).toBe(true)

    const anaOffline = nextEvent(ownerSide.socket, 'presence:update')
    anaSide.socket.close()
    expect(await anaOffline).toEqual({ serverId, userId: ana.user.id, online: false })
  })

  it('answers the ack with the error contract', async () => {
    const { serverId } = await serverWithMember()
    const outsider = await signedIn(app)
    const socket = await connect(outsider.cookie)

    const notMember = await socket.emitWithAck('server:subscribe', { serverId })
    expect(notMember).toEqual({ ok: false, error: expect.objectContaining({ code: 'SERVER_NOT_FOUND' }) })
    const invalid = await socket.emitWithAck('server:subscribe', { serverId: 42 } as never)
    expect(invalid).toEqual({
      ok: false,
      error: expect.objectContaining({ code: 'VALIDATION_FAILED', fields: { serverId: expect.any(Array) } }),
    })
  })

  it('takes a kicked member out of the server and tells the others', async () => {
    const { owner, ana, serverId } = await serverWithMember()
    const ownerSide = await subscribed(owner.cookie, serverId)
    const anaSide = await subscribed(ana.cookie, serverId)

    const removed = nextEvent(anaSide.socket, 'server:removed')
    const changed = nextEvent(ownerSide.socket, 'server:changed')
    expect((await owner.agent.post(`/api/servers/${serverId}/members/${ana.user.id}/kick`)).status).toBe(204)
    expect(await removed).toEqual({ serverId, reason: 'kicked' })
    expect(await changed).toEqual({ serverId })

    // Ana's socket no longer follows the server.
    const anaChanges: unknown[] = []
    anaSide.socket.on('server:changed', (payload) => anaChanges.push(payload))
    const renamed = nextEvent(ownerSide.socket, 'server:changed')
    await owner.agent.patch(`/api/servers/${serverId}`).send({ name: 'Turbex 2' })
    await renamed
    expect(anaChanges).toEqual([])
  })

  it('tells every member when the server is deleted', async () => {
    const { owner, ana, serverId } = await serverWithMember()
    const anaSocket = await connect(ana.cookie)

    const removed = nextEvent(anaSocket, 'server:removed')
    expect((await owner.agent.delete(`/api/servers/${serverId}`)).status).toBe(204)
    expect(await removed).toEqual({ serverId, reason: 'deleted' })
  })

  it('disconnects every tab of a suspended user at once', async () => {
    const { ana } = await serverWithMember()
    const tabs = [await connect(ana.cookie), await connect(ana.cookie)]

    const revoked = tabs.map((tab) => nextEvent(tab, 'session:revoked'))
    const closed = tabs.map((tab) => new Promise((resolve) => tab.once('disconnect', resolve)))
    await app.get(DomainEventBus).publish('user.suspended', { userId: ana.user.id })

    await Promise.all([...revoked, ...closed])
    await expect.poll(() => app.get(PresenceStore).isOnline(ana.user.id)).toBe(false)
  })

  it('documents the events in AsyncAPI', async () => {
    const response = await request(app.getHttpServer()).get('/api/docs/asyncapi.json')

    const channels = Object.values(response.body.channels as Record<string, { address: string }>)
    expect(channels.map((channel) => channel.address)).toEqual(
      expect.arrayContaining([
        'server:subscribe',
        'presence:snapshot',
        'presence:update',
        'server:changed',
        'server:removed',
        'session:revoked',
      ]),
    )
  })
})
