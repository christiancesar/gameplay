import { ServerNotFoundError } from '../../servers/errors/servers.errors'
import { makeRealtimeContext } from '../test/realtime-context'

describe('presence use-cases', () => {
  it('announces the first tab to every server of the user', async () => {
    const { connect, emitter } = makeRealtimeContext()

    await connect.execute({ userId: 'ana', socketId: 'tab-1' })
    await connect.execute({ userId: 'ana', socketId: 'tab-2' })

    expect(emitter.emitted).toEqual([
      { event: 'presence:update', serverIds: ['s1', 's2'], userId: 'ana', online: true },
    ])
  })

  it('announces offline only when the last tab closes', async () => {
    const { connect, disconnect, emitter } = makeRealtimeContext()
    await connect.execute({ userId: 'bia', socketId: 'tab-1' })
    await connect.execute({ userId: 'bia', socketId: 'tab-2' })
    emitter.emitted.length = 0

    await disconnect.execute({ userId: 'bia', socketId: 'tab-1' })
    expect(emitter.emitted).toEqual([])
    await disconnect.execute({ userId: 'bia', socketId: 'tab-2' })
    expect(emitter.emitted).toEqual([{ event: 'presence:update', serverIds: ['s1'], userId: 'bia', online: false }])
  })

  it('gives a member the online members of the server', async () => {
    const { connect, subscribe } = makeRealtimeContext()
    await connect.execute({ userId: 'bia', socketId: 'tab-1' })

    expect(await subscribe.execute({ serverId: 's1', userId: 'ana' })).toEqual({
      serverId: 's1',
      onlineUserIds: ['bia'],
      rooms: [],
    })
  })

  it('refuses to subscribe someone who is not a member', async () => {
    const { subscribe } = makeRealtimeContext()

    await expect(subscribe.execute({ serverId: 's2', userId: 'bia' })).rejects.toBeInstanceOf(ServerNotFoundError)
  })
})
