import { RoomNotFoundError } from '../../servers/errors/servers.errors'
import {
  NotInRoomError,
  NotStreamingError,
  PeerNotInRoomError,
  ScreenNotPublishedError,
  StreamModeDisabledError,
} from '../errors/realtime.errors'
import { makeRealtimeContext } from '../test/realtime-context'

const idle = (userId: string) => ({ userId, muted: false, deafened: false, streaming: null, streamMode: null })

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
    await updateVoiceState.execute({ userId: 'ana', socketId: 'ana-tab', streaming: '1080p30', streamMode: 'mesh' })

    expect(emitter.of('room:participants').at(-1)?.participants).toEqual([
      { ...idle('ana'), muted: true, streaming: '1080p30', streamMode: 'mesh' },
    ])
    await expect(
      updateVoiceState.execute({ userId: 'ana', socketId: 'other', streaming: null }),
    ).rejects.toBeInstanceOf(NotInRoomError)
  })

  describe('screen share through the SFU', () => {
    const video = { mid: '0', kind: 'video' as const, trackName: 'screen-video-0' }
    const sfuSession = (sessionId: string, roomId: string) => ({
      sessionId,
      userId: 'ana',
      serverId: 's1',
      roomId,
      published: [],
      pulled: [],
    })

    it('needs the screen published to the SFU from the same room', async () => {
      const { join, updateVoiceState, sfuSessions } = makeRealtimeContext()
      await join('ana', 'r1')
      const start = () =>
        updateVoiceState.execute({ userId: 'ana', socketId: 'ana-tab', streaming: '1080p60', streamMode: 'sfu' })

      await expect(start()).rejects.toBeInstanceOf(ScreenNotPublishedError)

      await sfuSessions.add(sfuSession('other-room', 'r2'))
      await sfuSessions.addPublished('other-room', [video])
      await expect(start()).rejects.toBeInstanceOf(ScreenNotPublishedError)

      await sfuSessions.add(sfuSession('here', 'r1'))
      await sfuSessions.addPublished('here', [video])
      await expect(start()).resolves.toBeUndefined()
    })

    it('tells the media module when the share changes and when the person leaves', async () => {
      const { join, updateVoiceState, leaveRoom, events } = makeRealtimeContext()
      await join('ana', 'r1')

      await updateVoiceState.execute({ userId: 'ana', socketId: 'ana-tab', streaming: '720p30', streamMode: 'mesh' })
      await updateVoiceState.execute({ userId: 'ana', socketId: 'ana-tab', streaming: null })
      await join('ana', 'r2')
      await leaveRoom.execute({ userId: 'ana', socketId: 'ana-tab' })

      expect(events.published).toEqual([
        { name: 'stream.changed', payload: { userId: 'ana', roomId: 'r1', mode: 'mesh' } },
        { name: 'stream.changed', payload: { userId: 'ana', roomId: 'r1', mode: null } },
        { name: 'voice.left-room', payload: { userId: 'ana', roomId: 'r1' } },
        { name: 'voice.left-room', payload: { userId: 'ana', roomId: 'r2' } },
      ])
    })
  })

  describe('media resources turned off', () => {
    it('refuses a share in a mode the server has off', async () => {
      const { join, updateVoiceState, mediaSettings } = makeRealtimeContext()
      await join('ana', 'r1')
      mediaSettings.addServer('s1')
      await mediaSettings.setServer('s1', { sfu: null, mesh: false, turn: null })

      await expect(
        updateVoiceState.execute({ userId: 'ana', socketId: 'ana-tab', streaming: '720p30', streamMode: 'mesh' }),
      ).rejects.toBeInstanceOf(StreamModeDisabledError)
    })

    it('stops the shares in a mode that went off and tells everyone to refetch', async () => {
      const { join, updateVoiceState, mediaSettings, applyMediaChange, emitter, events } = makeRealtimeContext()
      await join('ana', 'r1')
      await join('bia', 'r1')
      await join('caio', 'r2')
      await updateVoiceState.execute({ userId: 'bia', socketId: 'bia-tab', streaming: '720p30', streamMode: 'mesh' })
      await updateVoiceState.execute({ userId: 'caio', socketId: 'caio-tab', streaming: '720p30', streamMode: 'mesh' })
      // r2 is in s1 too; caio keeps mesh only if the server overrides it, so turn it off globally.
      await mediaSettings.setGlobal({ sfu: true, mesh: false, turn: false })
      emitter.emitted.length = 0
      events.published.length = 0

      await applyMediaChange.execute({ serverId: null, disabled: ['mesh', 'turn'], turnCutUserIds: ['ana', 'bia'] })

      expect(emitter.of('stream:ended')).toEqual([
        { event: 'stream:ended', socketId: 'bia-tab', ended: { reason: 'disabled' } },
        { event: 'stream:ended', socketId: 'caio-tab', ended: { reason: 'disabled' } },
      ])
      expect(events.published.map((e) => e.name)).toEqual(['stream.changed', 'stream.changed'])
      expect(emitter.of('room:participants').at(-1)?.participants).toEqual([idle('caio')])
      expect(emitter.of('media:changed')).toEqual([
        { event: 'media:changed', to: 'everyone', change: { serverId: null, turnOff: false } },
        { event: 'media:changed', to: { userIds: ['ana', 'bia'] }, change: { serverId: null, turnOff: true } },
      ])
    })

    it('keeps the shares of a server that overrides the global setting', async () => {
      const { join, updateVoiceState, mediaSettings, applyMediaChange, emitter } = makeRealtimeContext()
      await join('bia', 'r1')
      await updateVoiceState.execute({ userId: 'bia', socketId: 'bia-tab', streaming: '720p30', streamMode: 'mesh' })
      mediaSettings.addServer('s1')
      await mediaSettings.setServer('s1', { sfu: null, mesh: true, turn: null })
      await mediaSettings.setGlobal({ sfu: true, mesh: false, turn: true })

      await applyMediaChange.execute({ serverId: null, disabled: ['mesh'], turnCutUserIds: [] })

      expect(emitter.of('stream:ended')).toEqual([])
    })
  })

  describe('usage reports from viewers', () => {
    const quality = { width: 1280, height: 720, fps: 30, kbps: 2500 }

    it('relays the quality to the streamer and counts the bytes, through the SFU only', async () => {
      const { join, store, reportUsage, emitter, events } = makeRealtimeContext()
      await join('ana', 'r1')
      await join('bia', 'r1')
      await store.update('ana', 'ana-tab', { streaming: '720p30', streamMode: 'sfu' })
      emitter.emitted.length = 0

      await reportUsage.execute({ userId: 'bia', socketId: 'bia-tab', streamerId: 'ana', bytes: 1000, quality })

      expect(emitter.emitted).toEqual([
        { event: 'stream:received', socketId: 'ana-tab', received: { viewerId: 'bia', quality } },
      ])
      expect(events.published).toContainEqual({ name: 'media.usage-reported', payload: { userId: 'bia', bytes: 1000 } })

      await store.update('ana', 'ana-tab', { streaming: '720p30', streamMode: 'mesh' })
      await expect(
        reportUsage.execute({ userId: 'bia', socketId: 'bia-tab', streamerId: 'ana', bytes: 1000, quality }),
      ).rejects.toBeInstanceOf(NotStreamingError)
    })

    it('only from someone in the same room', async () => {
      const { join, store, reportUsage } = makeRealtimeContext()
      await join('ana', 'r1')
      await join('caio', 'r2')
      await store.update('ana', 'ana-tab', { streaming: '720p30', streamMode: 'sfu' })

      await expect(
        reportUsage.execute({ userId: 'caio', socketId: 'caio-tab', streamerId: 'ana', bytes: 1, quality: null }),
      ).rejects.toBeInstanceOf(PeerNotInRoomError)
    })
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
