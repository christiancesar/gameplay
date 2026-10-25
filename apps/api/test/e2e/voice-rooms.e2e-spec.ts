import type { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { PrismaService } from '../../src/lib/prisma'
import { createServerWithMembers } from '../factories/server.factory'
import { createTestApp } from '../support/create-test-app'
import { resetDatabase } from '../support/database'
import { signedIn } from '../support/signed-in'
import { collectFor, connectSocket, nextEvent, participantsWhere, type TestSocket } from '../support/socket-client'

type Person = { cookie: string }

const idle = (userId: string) => ({ userId, muted: false, deafened: false, streaming: null })

describe('Voice rooms (e2e)', () => {
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

  async function connect(person: Person) {
    const socket = await connectSocket(app, person.cookie)
    sockets.push(socket)
    return socket
  }

  // Owner, Ana and Bia in one server with two rooms.
  async function serverWithThree() {
    const { owner, members, serverId, roomIds } = await createServerWithMembers(app, { members: 2, extraRooms: 1 })
    const [ana, bia] = members
    return { owner, ana, bia, serverId, room1: roomIds[0], room2: roomIds[1] }
  }

  it('lets three people talk, signal only each other, and switch rooms', async () => {
    const { owner, ana, bia, room1, room2 } = await serverWithThree()
    const [o, a, b] = [await connect(owner), await connect(ana), await connect(bia)]

    expect(await o.emitWithAck('room:join', { roomId: room1 })).toEqual({
      ok: true,
      data: { participants: [idle(owner.user.id)] },
    })
    await a.emitWithAck('room:join', { roomId: room1 })
    const all = participantsWhere(o, room1, ({ participants }) => participants.length === 3)
    const joined = await b.emitWithAck('room:join', { roomId: room1, muted: true })
    expect(joined).toEqual({
      ok: true,
      data: { participants: [idle(owner.user.id), idle(ana.user.id), { ...idle(bia.user.id), muted: true }] },
    })
    await all

    // Signals reach only the one they are for.
    const toBia = nextEvent(b, 'signal:receive')
    const anaHears = collectFor(a, 'signal:receive')
    const offer = { sdp: 'v=0', type: 'offer' }
    expect(await o.emitWithAck('signal:send', { to: bia.user.id, kind: 'offer', data: offer })).toEqual({ ok: true })
    expect(await toBia).toEqual({ from: owner.user.id, kind: 'offer', data: offer })
    expect(await anaHears).toEqual([])

    // Mute and screen share show up for the others.
    const anaStreams = participantsWhere(o, room1, ({ participants }) =>
      participants.some((p) => p.userId === ana.user.id && p.muted && p.streaming === '1080p60'),
    )
    await a.emitWithAck('voice:state', { muted: true, deafened: false })
    await a.emitWithAck('stream:start', { preset: '1080p60' })
    await anaStreams

    // Watching and quality reach only the streamer.
    const watch = nextEvent(a, 'stream:watch-request')
    expect(await b.emitWithAck('stream:watch', { streamerId: ana.user.id })).toEqual({ ok: true })
    expect(await watch).toEqual({ viewerId: bia.user.id })
    const quality = nextEvent(a, 'stream:quality')
    await b.emitWithAck('stream:quality', { streamerId: ana.user.id, level: 'medium' })
    expect(await quality).toEqual({ viewerId: bia.user.id, level: 'medium' })
    const notStreaming = await a.emitWithAck('stream:watch', { streamerId: bia.user.id })
    expect(notStreaming).toMatchObject({ ok: false, error: { code: 'NOT_STREAMING' } })

    // Bia switches rooms: gone from room 1, and no longer reachable from there.
    const biaGone = participantsWhere(o, room1, ({ participants }) => participants.length === 2)
    await b.emitWithAck('room:join', { roomId: room2 })
    expect((await biaGone).participants.map((p) => p.userId)).toEqual([owner.user.id, ana.user.id])
    const acrossRooms = await o.emitWithAck('signal:send', { to: bia.user.id, kind: 'candidate', data: {} })
    expect(acrossRooms).toMatchObject({ ok: false, error: { code: 'PEER_NOT_IN_ROOM' } })
  })

  it('refuses a room of a server the person is not in, and events without a seat', async () => {
    const { room1 } = await serverWithThree()
    const outsider = await connect(await signedIn(app))

    expect(await outsider.emitWithAck('room:join', { roomId: room1 })).toMatchObject({
      ok: false,
      error: { code: 'ROOM_NOT_FOUND' },
    })
    expect(await outsider.emitWithAck('voice:state', { muted: true, deafened: false })).toMatchObject({
      ok: false,
      error: { code: 'NOT_IN_ROOM' },
    })
  })

  it('moves the seat to the tab that joined last', async () => {
    const { owner, ana, room1, room2 } = await serverWithThree()
    const o = await connect(owner)
    await o.emitWithAck('room:join', { roomId: room1 })
    const [tab1, tab2] = [await connect(ana), await connect(ana)]
    await tab1.emitWithAck('room:join', { roomId: room1 })

    const left = nextEvent(tab1, 'room:left')
    const anaGone = participantsWhere(o, room1, ({ participants }) => participants.length === 1)
    await tab2.emitWithAck('room:join', { roomId: room2 })
    expect(await left).toEqual({ roomId: room1, reason: 'other-tab' })
    await anaGone

    // The old tab no longer acts on the seat.
    const stale = await tab1.emitWithAck('voice:state', { muted: true, deafened: false })
    expect(stale).toMatchObject({ ok: false, error: { code: 'NOT_IN_ROOM' } })
  })

  it('keeps the seat through a quick reconnection and frees it after the wait', async () => {
    const { owner, ana, room1 } = await serverWithThree()
    const o = await connect(owner)
    await o.emitWithAck('room:join', { roomId: room1 })
    const first = await connect(ana)
    await first.emitWithAck('room:join', { roomId: room1 })
    await first.emitWithAck('stream:start', { preset: '720p30' })

    first.close()
    const again = await connect(ana)
    const back = await again.emitWithAck('room:join', { roomId: room1 })
    expect(back).toEqual({
      ok: true,
      data: { participants: [idle(owner.user.id), { ...idle(ana.user.id), streaming: '720p30' }] },
    })

    const anaGone = participantsWhere(o, room1, ({ participants }) => participants.length === 1)
    again.close()
    expect((await anaGone).participants).toEqual([idle(owner.user.id)])
  })

  it('takes people out when kicked or when the room is deleted', async () => {
    const { owner, ana, bia, serverId, room1, room2 } = await serverWithThree()
    const [o, a, b] = [await connect(owner), await connect(ana), await connect(bia)]
    await o.emitWithAck('room:join', { roomId: room1 })
    await a.emitWithAck('room:join', { roomId: room1 })
    await b.emitWithAck('room:join', { roomId: room2 })

    const anaLeft = nextEvent(a, 'room:left')
    const anaGone = participantsWhere(o, room1, ({ participants }) => participants.length === 1)
    expect((await owner.agent.post(`/api/servers/${serverId}/members/${ana.user.id}/kick`)).status).toBe(204)
    expect(await anaLeft).toEqual({ roomId: room1, reason: 'removed' })
    await anaGone

    const biaLeft = nextEvent(b, 'room:left')
    const ownerLeft = collectFor(o, 'room:left')
    expect((await owner.agent.delete(`/api/servers/${serverId}/rooms/${room2}`)).status).toBe(204)
    expect(await biaLeft).toEqual({ roomId: room2, reason: 'room-deleted' })
    expect(await ownerLeft).toEqual([])
  })

  it('shows the voice rooms in the presence snapshot', async () => {
    const { owner, ana, serverId, room2 } = await serverWithThree()
    const a = await connect(ana)
    await a.emitWithAck('room:join', { roomId: room2, deafened: true })

    const o = await connect(owner)
    const snapshot = nextEvent(o, 'presence:snapshot')
    await o.emitWithAck('server:subscribe', { serverId })
    expect((await snapshot).rooms).toEqual([
      { roomId: room2, participants: [{ ...idle(ana.user.id), deafened: true }] },
    ])
  })

  it('documents the voice events in AsyncAPI', async () => {
    const response = await request(app.getHttpServer()).get('/api/docs/asyncapi.json')

    const addresses = Object.values(response.body.channels as Record<string, { address: string }>).map(
      (channel) => channel.address,
    )
    expect(addresses).toEqual(
      expect.arrayContaining(['room:join', 'room:participants', 'room:left', 'signal:send', 'signal:receive']),
    )
  })
})
