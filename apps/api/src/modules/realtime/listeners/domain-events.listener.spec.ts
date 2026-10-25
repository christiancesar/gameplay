import { makeRealtimeContext } from '../test/fakes'

describe('DomainEventsListener', () => {
  it('turns server, room and membership changes into server:changed', async () => {
    const { listener, emitter } = makeRealtimeContext()

    listener.serverUpdated({ serverId: 's1' })
    listener.roomChanged({ serverId: 's1', deletedRoomId: 'r1' })
    listener.joinRequested({ serverId: 's1', userId: 'caio', requestId: 'q1' })
    listener.declined({ serverId: 's1', userId: 'caio', declinedById: 'ana' })
    listener.roleChanged({ serverId: 's1', userId: 'bia', role: 'admin' })

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

  it('removes a kicked or leaving member and tells the others', () => {
    const { listener, emitter } = makeRealtimeContext()

    listener.removed({ serverId: 's1', userId: 'bia', reason: 'kick' })
    listener.removed({ serverId: 's1', userId: 'caio', reason: 'leave' })

    expect(emitter.emitted).toEqual([
      { event: 'server:removed', userIds: ['bia'], removal: { serverId: 's1', reason: 'kicked' } },
      { event: 'server:changed', serverId: 's1' },
      { event: 'server:removed', userIds: ['caio'], removal: { serverId: 's1', reason: 'left' } },
      { event: 'server:changed', serverId: 's1' },
    ])
  })

  it('removes every member of a deleted server', () => {
    const { listener, emitter } = makeRealtimeContext()

    listener.serverDeleted({ serverId: 's1', memberIds: ['ana', 'bia'] })

    expect(emitter.emitted).toEqual([
      { event: 'server:removed', userIds: ['ana', 'bia'], removal: { serverId: 's1', reason: 'deleted' } },
    ])
  })

  it('revokes the socket session on suspension or ended sessions', () => {
    const { listener, emitter } = makeRealtimeContext()

    listener.suspended({ userId: 'bia' })
    listener.sessionsRevoked({ userId: 'ana' })

    expect(emitter.emitted).toEqual([
      { event: 'session:revoked', userId: 'bia' },
      { event: 'session:revoked', userId: 'ana' },
    ])
  })
})
