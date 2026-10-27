import type { INestApplication } from '@nestjs/common'
import { PrismaService } from '../../src/lib/prisma'
import { createServerWithMembers } from '../factories/server.factory'
import { createTestApp } from '../support/create-test-app'
import { resetDatabase } from '../support/database'
import { signedIn } from '../support/signed-in'
import { connectSocket, nextEvent, type TestSocket } from '../support/socket-client'

const ALL_ON = { sfu: true, mesh: true, turn: true }
const FOLLOW = { sfu: null, mesh: null, turn: null }

describe('Media resources (e2e)', () => {
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

  async function inRoom(cookie: string, roomId: string) {
    const socket = await connectSocket(app, cookie)
    sockets.push(socket)
    await socket.emitWithAck('room:join', { roomId })
    return socket
  }

  it('turning mesh off stops the mesh shares, tells the people cut off and refuses new ones', async () => {
    const admin = await signedIn(app, { admin: true })
    const { owner, members, roomIds } = await createServerWithMembers(app)
    const [ana] = members
    const ownerSocket = await inRoom(owner.cookie, roomIds[0])
    const anaSocket = await inRoom(ana.cookie, roomIds[0])
    expect(await ownerSocket.emitWithAck('stream:start', { preset: '720p30', mode: 'mesh' })).toEqual({ ok: true })

    expect((await admin.agent.get('/api/admin/media/impact')).body).toEqual({ sfu: 0, mesh: 2, turn: 2 })

    const ended = nextEvent(ownerSocket, 'stream:ended')
    const changed = nextEvent(anaSocket, 'media:changed')
    const toAna = nextEvent(anaSocket, 'notification:new')
    const response = await admin.agent.put('/api/admin/media').send({
      settings: { ...ALL_ON, mesh: false },
      notice: { title: 'Direct sharing off', message: 'Use the server mode.', audience: 'affected' },
    })
    expect(response.status).toBe(200)
    expect(response.body).toEqual({ notified: 2 })
    expect(await ended).toEqual({ reason: 'disabled' })
    expect(await changed).toEqual({ serverId: null, turnOff: false })
    expect((await toAna).announcement).toEqual({ title: 'Direct sharing off', message: 'Use the server mode.' })

    expect(await ownerSocket.emitWithAck('stream:start', { preset: '720p30', mode: 'mesh' })).toMatchObject({
      ok: false,
      error: { code: 'STREAM_MODE_DISABLED' },
    })
    expect((await admin.agent.get('/api/admin/media')).body).toMatchObject({
      settings: { ...ALL_ON, mesh: false },
      providers: { sfu: { state: 'not-configured' }, turn: { state: 'not-configured' } },
      exceptions: [],
    })
  })

  it('a server override wins both ways, and members see what their server offers', async () => {
    const admin = await signedIn(app, { admin: true })
    const { owner, serverId } = await createServerWithMembers(app)

    await admin.agent.put('/api/admin/media').send({ settings: { ...ALL_ON, sfu: false } })
    const set = await admin.agent
      .put(`/api/admin/servers/${serverId}/media`)
      .send({ overrides: { ...FOLLOW, sfu: true, turn: false } })
    expect(set.body).toEqual({ notified: 0 })

    expect((await admin.agent.get(`/api/admin/servers/${serverId}/media`)).body).toEqual({
      ...FOLLOW,
      sfu: true,
      turn: false,
    })
    expect((await owner.agent.get(`/api/servers/${serverId}/media`)).body).toEqual({
      sfu: { available: false, reason: 'not-configured' },
      mesh: { available: true },
      turn: { available: false },
    })
    expect((await admin.agent.get('/api/admin/media')).body.exceptions).toEqual([
      { serverId, serverName: expect.any(String), overrides: { ...FOLLOW, sfu: true, turn: false } },
    ])
    // Not a member: the server stays hidden.
    expect((await admin.agent.get(`/api/servers/${serverId}/media`)).status).toBe(404)
    expect((await owner.agent.put(`/api/admin/servers/${serverId}/media`).send({ overrides: FOLLOW })).status).toBe(403)
  })

  it('usage for a period: presets, a custom range of the last 30 days, and nothing older', async () => {
    const admin = await signedIn(app, { admin: true })

    const day = await admin.agent.get('/api/admin/media/usage').query({ period: '24h' })
    expect(day.status).toBe(200)
    expect(day.body).toMatchObject({
      bucket: 'fifteen-minutes',
      points: [],
      sfu: { cloudflareBytes: null },
      turn: { cloudflareBytes: null },
      cloudflare: { state: 'not-configured', checkedAt: null },
    })
    expect(Date.parse(day.body.to) - Date.parse(day.body.from)).toBe(24 * 60 * 60 * 1000)

    const today = new Date().toISOString().slice(0, 10)
    const custom = await admin.agent.get('/api/admin/media/usage').query({ period: 'custom', from: today, to: today })
    expect(custom.status).toBe(200)
    expect(custom.body.from).toBe(`${today}T00:00:00.000Z`)

    const noDates = await admin.agent.get('/api/admin/media/usage').query({ period: 'custom' })
    expect(noDates.status).toBe(400)
    const old = await admin.agent
      .get('/api/admin/media/usage')
      .query({ period: 'custom', from: '2020-01-01', to: today })
    expect(old.status).toBe(400)
    expect(old.body.error.code).toBe('USAGE_PERIOD_OUT_OF_RANGE')
  })
})
