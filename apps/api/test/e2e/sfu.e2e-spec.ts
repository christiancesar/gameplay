import type { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { PrismaService } from '../../src/lib/prisma'
import { SfuProvider } from '../../src/modules/media/providers/sfu/sfu.provider'
import { FakeSfuProvider } from '../../src/modules/media/test/fake-sfu-provider'
import { createServerWithMembers } from '../factories/server.factory'
import { createTestApp } from '../support/create-test-app'
import { resetDatabase } from '../support/database'
import { signedIn } from '../support/signed-in'
import { connectSocket, nextEvent, type TestSocket } from '../support/socket-client'

const offer = { type: 'offer', sdp: 'browser-offer' }
const screen = [
  { mid: '0', kind: 'video' },
  { mid: '1', kind: 'audio' },
]

// The e2e env has no SFU credentials: the real app answers "not configured",
// and a fake SFU stands in for Cloudflare in the rest.
describe('Screen share through the SFU (e2e)', () => {
  let app: INestApplication
  const sockets: TestSocket[] = []

  beforeAll(async () => {
    app = await createTestApp({
      override: (builder) => builder.overrideProvider(SfuProvider).useValue(new FakeSfuProvider()),
    })
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

  it('lets a streamer publish and a viewer in the same room watch', async () => {
    const { owner, members, roomIds } = await createServerWithMembers(app, { members: 2, extraRooms: 1 })
    const [ana, caio] = members
    const ownerSocket = await inRoom(owner.cookie, roomIds[0])
    await inRoom(ana.cookie, roomIds[0])
    await inRoom(caio.cookie, roomIds[1])

    expect((await owner.agent.get('/api/media/sfu')).body).toEqual({ available: true, reason: null })

    // Starting in sfu mode needs the screen on the SFU first.
    expect(await ownerSocket.emitWithAck('stream:start', { preset: '1080p60', mode: 'sfu' })).toMatchObject({
      ok: false,
      error: { code: 'SCREEN_NOT_PUBLISHED' },
    })
    const { sessionId } = (await owner.agent.post('/api/media/sfu/sessions')).body
    const published = await owner.agent
      .post(`/api/media/sfu/sessions/${sessionId}/publish`)
      .send({ sessionDescription: offer, tracks: screen })
    expect(published.status).toBe(200)
    expect(published.body.sessionDescription).toEqual({ type: 'answer', sdp: 'sfu-answer' })
    expect(await ownerSocket.emitWithAck('stream:start', { preset: '1080p60', mode: 'sfu' })).toEqual({ ok: true })

    const anaSession = (await ana.agent.post('/api/media/sfu/sessions')).body.sessionId
    const watched = await ana.agent
      .post(`/api/media/sfu/sessions/${anaSession}/watch`)
      .send({ streamerId: owner.user.id })
    expect(watched.status).toBe(200)
    expect(watched.body).toMatchObject({
      requiresImmediateRenegotiation: true,
      tracks: [{ kind: 'video' }, { kind: 'audio' }],
    })

    const answered = await ana.agent
      .put(`/api/media/sfu/sessions/${anaSession}/renegotiate`)
      .send({ sessionDescription: { type: 'answer', sdp: 'browser-answer' } })
    expect(answered.status).toBe(204)

    // Someone in another room can't watch, and nobody uses another's session.
    const caioSession = (await caio.agent.post('/api/media/sfu/sessions')).body.sessionId
    const outside = await caio.agent
      .post(`/api/media/sfu/sessions/${caioSession}/watch`)
      .send({ streamerId: owner.user.id })
    expect(outside.body.error.code).toBe('PEER_NOT_IN_ROOM')
    const stolen = await caio.agent
      .put(`/api/media/sfu/sessions/${anaSession}/close`)
      .send({ mids: [watched.body.tracks[0].mid] })
    expect(stolen.status).toBe(404)
  })

  it('counts what viewers report and stops new shares past the monthly budget', async () => {
    const admin = await signedIn(app, { admin: true })
    const { owner, members, roomIds } = await createServerWithMembers(app)
    const [ana] = members
    const ownerSocket = await inRoom(owner.cookie, roomIds[0])
    const anaSocket = await inRoom(ana.cookie, roomIds[0])
    const { sessionId } = (await owner.agent.post('/api/media/sfu/sessions')).body
    await owner.agent
      .post(`/api/media/sfu/sessions/${sessionId}/publish`)
      .send({ sessionDescription: offer, tracks: screen })
    await ownerSocket.emitWithAck('stream:start', { preset: '720p30', mode: 'sfu' })

    const quality = { width: 1280, height: 720, fps: 30, kbps: 2500 }
    const received = nextEvent(ownerSocket, 'stream:received')
    expect(
      await anaSocket.emitWithAck('media:usage', { streamerId: owner.user.id, bytes: 3_000_000, quality }),
    ).toEqual({ ok: true })
    expect(await received).toEqual({ viewerId: ana.user.id, quality })
    expect((await admin.agent.get('/api/admin/media')).body.sfuUsage).toMatchObject({
      usedBytes: 3_000_000,
      budgetGb: 800,
    })

    expect((await admin.agent.put('/api/admin/media/budget').send({ budgetGb: 0 })).status).toBe(204)
    expect((await owner.agent.get('/api/media/sfu')).body).toEqual({ available: false, reason: 'budget-exhausted' })
    const again = (await ana.agent.post('/api/media/sfu/sessions')).body.sessionId
    const refused = await ana.agent
      .post(`/api/media/sfu/sessions/${again}/publish`)
      .send({ sessionDescription: offer, tracks: screen })
    expect(refused.body.error.code).toBe('SFU_BUDGET_EXHAUSTED')
  })

  it('asks for a voice room and a session', async () => {
    const { owner } = await createServerWithMembers(app)

    expect((await owner.agent.post('/api/media/sfu/sessions')).body.error.code).toBe('NOT_IN_ROOM')
    expect((await request(app.getHttpServer()).get('/api/media/sfu')).status).toBe(401)
  })
})

describe('SFU without credentials (e2e)', () => {
  let app: INestApplication

  beforeAll(async () => {
    app = await createTestApp()
    await resetDatabase(app.get(PrismaService))
  })

  afterAll(async () => {
    await app.close()
  })

  it('reports it is not configured', async () => {
    const { owner } = await createServerWithMembers(app)

    expect((await owner.agent.get('/api/media/sfu')).body).toEqual({ available: false, reason: 'not-configured' })
    expect((await owner.agent.post('/api/media/sfu/sessions')).status).toBe(503)
  })
})
