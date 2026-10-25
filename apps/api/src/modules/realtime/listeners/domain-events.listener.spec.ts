import { makeRealtimeContext } from '../test/realtime-context'

describe('DomainEventsListener', () => {
  it('turns server, room and membership changes into server:changed', async () => {
    const { listener, emitter } = makeRealtimeContext()

    listener.serverUpdated({ serverId: 's1' })
    await listener.roomChanged({ serverId: 's1', deletedRoomId: 'r1' })
    listener.joinRequested({ serverId: 's1', userId: 'caio', requestId: 'q1' })
    listener.declined({ serverId: 's1', userId: 'caio', declinedById: 'ana' })
    listener.roleChanged({ serverId: 's1', userId: 'bia', role: 'admin' })

    // r1 was empty: no seats to clear.
    expect(emitter.emitted).toEqual(Array(5).fill({ event: 'server:changed', serverId: 's1' }))
  })

  it('announces a new member who is already online', async () => {
    const { listener, emitter, presence } = makeRealtimeContext()
    await presence.add('caio', 'tab-1')

    await listener.approved({ serverId: 's1', userId: 'caio', approvedById: 'ana' })
    await listener.approved({ serverId: 's1', userId: 'dani', approvedById: null })

    expect(emitter.emitted).toEqual([
      { event: 'server:changed', serverId: 's1' },
      { event: 'presence:update', serverIds: ['s1'], userId: 'caio', online: true },
      { event: 'server:changed', serverId: 's1' },
    ])
  })

  it('removes a kicked or leaving member and tells the others', async () => {
    const { listener, emitter } = makeRealtimeContext()

    await listener.removed({ serverId: 's1', userId: 'bia', reason: 'kick' })
    await listener.removed({ serverId: 's1', userId: 'caio', reason: 'leave' })

    expect(emitter.emitted).toEqual([
      { event: 'server:removed', userIds: ['bia'], removal: { serverId: 's1', reason: 'kicked' } },
      { event: 'server:changed', serverId: 's1' },
      { event: 'server:removed', userIds: ['caio'], removal: { serverId: 's1', reason: 'left' } },
      { event: 'server:changed', serverId: 's1' },
    ])
  })

  it('removes every member of a deleted server', async () => {
    const { listener, emitter } = makeRealtimeContext()

    await listener.serverDeleted({
      serverId: 's1',
      serverName: 'Turbex',
      memberIds: ['ana', 'bia'],
      deletedById: 'ana',
    })

    expect(emitter.emitted).toEqual([
      { event: 'server:removed', userIds: ['ana', 'bia'], removal: { serverId: 's1', reason: 'deleted' } },
    ])
  })

  it('revokes the socket session on suspension or ended sessions', async () => {
    const { listener, emitter } = makeRealtimeContext()

    await listener.suspended({ userId: 'bia' })
    await listener.sessionsRevoked({ userId: 'ana' })

    expect(emitter.emitted).toEqual([
      { event: 'session:revoked', userId: 'bia' },
      { event: 'session:revoked', userId: 'ana' },
    ])
  })
  it('tells the tabs of the user about a new notification', () => {
    const { listener, emitter } = makeRealtimeContext()

    listener.notificationCreated({ userId: 'bia', notificationId: 'n1' })

    expect(emitter.emitted).toEqual([{ event: 'notification:new', userId: 'bia', notificationId: 'n1' }])
  })

  describe('voice seats', () => {
    it('clears a deleted room and tells who was in it', async () => {
      const { listener, emitter, join } = makeRealtimeContext()
      await join('bia', 'r1')
      await join('caio', 'r2')
      emitter.emitted.length = 0

      await listener.roomChanged({ serverId: 's1', deletedRoomId: 'r1' })

      expect(emitter.emitted).toEqual([
        { event: 'seat:released', socketId: 'bia-tab', roomId: 'r1', reason: 'room-deleted' },
        { event: 'room:participants', serverId: 's1', roomId: 'r1', participants: [] },
        { event: 'server:changed', serverId: 's1' },
      ])
    })

    it('takes a kicked member out of the room before telling them', async () => {
      const { listener, emitter, join, store } = makeRealtimeContext()
      await join('bia', 'r1')
      await join('caio', 'r1')
      emitter.emitted.length = 0

      await listener.removed({ serverId: 's1', userId: 'bia', reason: 'kick' })

      expect(await store.find('bia')).toBeNull()
      expect(emitter.emitted.slice(0, 2)).toEqual([
        { event: 'seat:released', socketId: 'bia-tab', roomId: 'r1', reason: 'removed' },
        {
          event: 'room:participants',
          serverId: 's1',
          roomId: 'r1',
          participants: [{ userId: 'caio', muted: false, deafened: false, streaming: null }],
        },
      ])
    })

    it('keeps a seat in another server when the person leaves one', async () => {
      const { listener, join, store } = makeRealtimeContext()
      await join('ana', 'r3')

      await listener.removed({ serverId: 's1', userId: 'ana', reason: 'leave' })

      expect(await store.find('ana')).toMatchObject({ roomId: 'r3' })
    })

    it('clears every seat of a deleted server without announcing its rooms', async () => {
      const { listener, emitter, join, store } = makeRealtimeContext()
      await join('bia', 'r1')
      await join('caio', 'r2')
      emitter.emitted.length = 0

      await listener.serverDeleted({
        serverId: 's1',
        serverName: 'Turbex',
        memberIds: ['ana', 'bia', 'caio'],
        deletedById: 'ana',
      })

      expect(await store.listServer('s1')).toEqual([])
      expect(emitter.of('room:participants')).toEqual([])
      expect(emitter.of('seat:released').map((seat) => seat.reason)).toEqual(['removed', 'removed'])
    })

    it('frees the seat of a suspended user at once', async () => {
      const { listener, emitter, join, timers } = makeRealtimeContext()
      await join('bia', 'r1')
      emitter.emitted.length = 0

      await listener.suspended({ userId: 'bia' })

      expect(timers.pending.size).toBe(0)
      expect(emitter.emitted.map((emitted) => emitted.event)).toEqual([
        'seat:released',
        'room:participants',
        'session:revoked',
      ])
    })
  })
})
