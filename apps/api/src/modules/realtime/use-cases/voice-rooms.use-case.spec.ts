import { RoomNotFoundError } from '../../servers/errors/servers.errors'
import { NotInRoomError, NotStreamingError, PeerNotInRoomError } from '../errors/realtime.errors'
import { makeRealtimeContext } from '../test/fakes'

const idle = (userId: string) => ({ userId, muted: false, deafened: false, streaming: null })

describe('voice room use-cases', () => {
  describe('joining', () => {
    it('answers with the participants and announces the room', async () => {
      const { join, emitter } = makeRealtimeContext()
      await join('ana', 'r1')

      expect(await join('bia', 'r1')).toEqual({ participants: [idle('ana'), idle('bia')] })
      expect(emitter.of('room:participants').at(-1)).toEqual({
        event: 'room:participants',
        serverId: 's1',
        roomId: 'r1',
        participants: [idle('ana'), idle('bia')],
      })
      expect(emitter.of('seat:taken').at(-1)).toEqual({ event: 'seat:taken', socketId: 'bia-tab', roomId: 'r1' })
    })

    it('enters muted or deafened when asked', async () => {
      const { joinRoom } = makeRealtimeContext()

      const result = await joinRoom.execute({ userId: 'ana', socketId: 't', roomId: 'r1', muted: true, deafened: true })
      expect(result.participants).toEqual([{ ...idle('ana'), muted: true, deafened: true }])
    })

    it('refuses a missing room and a room of a server the person is not in', async () => {
      const { join } = makeRealtimeContext()

      await expect(join('bia', 'nope')).rejects.toBeInstanceOf(RoomNotFoundError)
      await expect(join('bia', 'r3')).rejects.toBeInstanceOf(RoomNotFoundError)
    })

    it('leaves the previous room when switching, and announces both', async () => {
      const { join, emitter, store } = makeRealtimeContext()
      await join('ana', 'r1')
      await store.update('ana', 'ana-tab', { streaming: '1080p60' })
      emitter.emitted.length = 0

      await join('ana', 'r2')

      expect(emitter.emitted).toEqual([
        { event: 'seat:released', socketId: 'ana-tab', roomId: 'r1', reason: null },
        { event: 'room:participants', serverId: 's1', roomId: 'r1', participants: [] },
        { event: 'seat:taken', socketId: 'ana-tab', roomId: 'r2' },
        { event: 'room:participants', serverId: 's1', roomId: 'r2', participants: [idle('ana')] },
      ])
    })

    it('moves between servers too', async () => {
      const { join, store } = makeRealtimeContext()
      await join('ana', 'r1')
      await join('ana', 'r3')

      expect(await store.listServer('s1')).toEqual([])
      expect(await store.find('ana')).toMatchObject({ serverId: 's2', roomId: 'r3' })
    })

    it('tells the other tab it lost the seat', async () => {
      const { join, emitter } = makeRealtimeContext()
      await join('ana', 'r1', 'tab-1')
      emitter.emitted.length = 0

      await join('ana', 'r2', 'tab-2')

      expect(emitter.emitted[0]).toEqual({
        event: 'seat:released',
        socketId: 'tab-1',
        roomId: 'r1',
        reason: 'other-tab',
      })
    })
  })

  describe('reconnection', () => {
    it('keeps the seat while the socket is away and frees it after the wait', async () => {
      const { join, disconnect, timers, store, emitter } = makeRealtimeContext()
      await join('ana', 'r1')
      await join('bia', 'r1')

      await disconnect.execute({ userId: 'bia', socketId: 'bia-tab' })
      expect(await store.find('bia')).toMatchObject({ socketId: null })
      expect(timers.pending.has('bia')).toBe(true)

      emitter.emitted.length = 0
      await timers.runAll()
      expect(await store.find('bia')).toBeNull()
      expect(emitter.of('room:participants')).toEqual([
        { event: 'room:participants', serverId: 's1', roomId: 'r1', participants: [idle('ana')] },
      ])
    })

    it('takes the seat back with the screen share on a new socket', async () => {
      const { join, disconnect, timers, store } = makeRealtimeContext()
      await join('ana', 'r1')
      await store.update('ana', 'ana-tab', { streaming: '720p60' })
      await disconnect.execute({ userId: 'ana', socketId: 'ana-tab' })

      const { participants } = await join('ana', 'r1', 'ana-tab-2')

      expect(participants).toEqual([{ ...idle('ana'), streaming: '720p60' }])
      expect(timers.pending.size).toBe(0)
      expect(await store.find('ana')).toMatchObject({ socketId: 'ana-tab-2' })
    })

    it('ignores the disconnect of a tab that holds no seat', async () => {
      const { join, disconnect, timers } = makeRealtimeContext()
      await join('ana', 'r1', 'tab-1')

      await disconnect.execute({ userId: 'ana', socketId: 'tab-2' })
      expect(timers.pending.size).toBe(0)
    })
  })

  it('leaves only from the tab holding the seat', async () => {
    const { join, leaveRoom, store, emitter } = makeRealtimeContext()
    await join('ana', 'r1')

    await leaveRoom.execute({ userId: 'ana', socketId: 'other' })
    expect(await store.find('ana')).not.toBeNull()

    emitter.emitted.length = 0
    await leaveRoom.execute({ userId: 'ana', socketId: 'ana-tab' })
    expect(await store.find('ana')).toBeNull()
    expect(emitter.emitted).toEqual([
      { event: 'seat:released', socketId: 'ana-tab', roomId: 'r1', reason: null },
      { event: 'room:participants', serverId: 's1', roomId: 'r1', participants: [] },
    ])
  })

  it('announces mute, deafen and the screen share', async () => {
    const { join, updateVoiceState, emitter } = makeRealtimeContext()
    await join('ana', 'r1')

    await updateVoiceState.execute({ userId: 'ana', socketId: 'ana-tab', muted: true, deafened: false })
    await updateVoiceState.execute({ userId: 'ana', socketId: 'ana-tab', streaming: '1080p30' })

    expect(emitter.of('room:participants').at(-1)?.participants).toEqual([
      { ...idle('ana'), muted: true, streaming: '1080p30' },
    ])
    await expect(
      updateVoiceState.execute({ userId: 'ana', socketId: 'other', streaming: null }),
    ).rejects.toBeInstanceOf(NotInRoomError)
  })

  describe('relaying', () => {
    async function threeInRooms() {
      const context = makeRealtimeContext()
      await context.join('ana', 'r1')
      await context.join('bia', 'r1')
      await context.join('caio', 'r2')
      context.emitter.emitted.length = 0
      return context
    }

    it('sends a signal only to the peer in the same room', async () => {
      const { relay, emitter } = await threeInRooms()

      await relay.execute({
        userId: 'ana',
        socketId: 'ana-tab',
        message: { type: 'signal', to: 'bia', kind: 'offer', data: { sdp: 'v=0' } },
      })
      expect(emitter.emitted).toEqual([
        { event: 'signal:receive', socketId: 'bia-tab', signal: { from: 'ana', kind: 'offer', data: { sdp: 'v=0' } } },
      ])

      const toOtherRoom = { type: 'signal', to: 'caio', kind: 'candidate', data: {} } as const
      await expect(relay.execute({ userId: 'ana', socketId: 'ana-tab', message: toOtherRoom })).rejects.toBeInstanceOf(
        PeerNotInRoomError,
      )
      const toSelf = { type: 'signal', to: 'ana', kind: 'candidate', data: {} } as const
      await expect(relay.execute({ userId: 'ana', socketId: 'ana-tab', message: toSelf })).rejects.toBeInstanceOf(
        PeerNotInRoomError,
      )
    })

    it('refuses a sender without a seat and a peer whose socket is away', async () => {
      const { relay, disconnect } = await threeInRooms()
      const signal = { type: 'signal', to: 'bia', kind: 'answer', data: {} } as const

      await expect(relay.execute({ userId: 'ana', socketId: 'other', message: signal })).rejects.toBeInstanceOf(
        NotInRoomError,
      )
      await disconnect.execute({ userId: 'bia', socketId: 'bia-tab' })
      await expect(relay.execute({ userId: 'ana', socketId: 'ana-tab', message: signal })).rejects.toBeInstanceOf(
        PeerNotInRoomError,
      )
    })

    it('passes watch and quality requests only to a streamer', async () => {
      const { relay, emitter, store } = await threeInRooms()
      const ana = { userId: 'ana', socketId: 'ana-tab' }

      await expect(relay.execute({ ...ana, message: { type: 'watch', streamerId: 'bia' } })).rejects.toBeInstanceOf(
        NotStreamingError,
      )
      await store.update('bia', 'bia-tab', { streaming: '1080p60' })

      await relay.execute({ ...ana, message: { type: 'watch', streamerId: 'bia' } })
      await relay.execute({ ...ana, message: { type: 'quality', streamerId: 'bia', level: 'low' } })
      await store.update('bia', 'bia-tab', { streaming: null })
      await relay.execute({ ...ana, message: { type: 'unwatch', streamerId: 'bia' } })

      expect(emitter.emitted).toEqual([
        { event: 'stream:watch-request', socketId: 'bia-tab', viewerId: 'ana' },
        { event: 'stream:quality', socketId: 'bia-tab', viewerId: 'ana', level: 'low' },
        { event: 'stream:unwatch', socketId: 'bia-tab', viewerId: 'ana' },
      ])
    })
  })

  it('shows who is in each room in the snapshot', async () => {
    const { join, subscribe } = makeRealtimeContext()
    await join('bia', 'r2')
    await join('ana', 'r1')
    await join('caio', 'r2')

    const { rooms } = await subscribe.execute({ serverId: 's1', userId: 'ana' })
    expect(rooms).toEqual([
      { roomId: 'r2', participants: [idle('bia'), idle('caio')] },
      { roomId: 'r1', participants: [idle('ana')] },
    ])
  })
})
