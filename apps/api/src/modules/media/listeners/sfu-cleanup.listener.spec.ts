import { makeMediaContext } from '../test/media-context'
import { BROWSER_OFFER, SCREEN_TRACKS } from '../test/media-seed'

// Ana publishes in r1 and Bia watches her there.
async function anaWatchedByBia() {
  const ctx = makeMediaContext()
  await ctx.join('ana', 'r1')
  await ctx.join('bia', 'r1')
  const { sessionId: anaSession } = await ctx.createSession.execute({ userId: 'ana' })
  await ctx.publish.execute({ userId: 'ana', sessionId: anaSession, offer: BROWSER_OFFER, tracks: SCREEN_TRACKS })
  await ctx.updateVoiceState.execute({ userId: 'ana', socketId: 'ana-tab', streaming: '1080p60', streamMode: 'sfu' })
  const { sessionId: biaSession } = await ctx.createSession.execute({ userId: 'bia' })
  await ctx.watch.execute({ userId: 'bia', sessionId: biaSession, streamerId: 'ana', layer: 'f' })
  ctx.provider.calls.length = 0
  return { ...ctx, anaSession, biaSession }
}

describe('SfuCleanupListener', () => {
  it('closes and forgets the sessions of the room the person left', async () => {
    const { cleanup, anaSession, biaSession, provider, sfuSessions } = await anaWatchedByBia()

    await cleanup.leftRoom({ userId: 'ana', roomId: 'r1' })

    expect(provider.calls).toEqual([{ op: 'close', sessionId: anaSession, mids: ['0', '1'], negotiated: false }])
    expect(await sfuSessions.find(anaSession)).toBeNull()
    expect((await sfuSessions.find(biaSession))?.pulled).toEqual([])
  })

  it('leaves sessions of other rooms alone', async () => {
    const { cleanup, anaSession, provider, sfuSessions } = await anaWatchedByBia()

    await cleanup.leftRoom({ userId: 'ana', roomId: 'r2' })

    expect(provider.calls).toEqual([])
    expect(await sfuSessions.find(anaSession)).not.toBeNull()
  })

  it('stops publishing when the share stops or moves to mesh', async () => {
    const { cleanup, anaSession, biaSession, provider, sfuSessions } = await anaWatchedByBia()

    await cleanup.streamChanged({ userId: 'ana', roomId: 'r1', mode: 'sfu' })
    expect(provider.calls).toEqual([])

    await cleanup.streamChanged({ userId: 'ana', roomId: 'r1', mode: 'mesh' })
    expect(provider.calls).toEqual([{ op: 'close', sessionId: anaSession, mids: ['0', '1'], negotiated: false }])
    expect(await sfuSessions.publicationOf('ana')).toBeNull()
    expect((await sfuSessions.find(biaSession))?.pulled).toEqual([])
  })

  it('still forgets the session when the SFU fails', async () => {
    const { cleanup, anaSession, provider, sfuSessions } = await anaWatchedByBia()
    provider.failing = true

    await expect(cleanup.leftRoom({ userId: 'ana', roomId: 'r1' })).resolves.toBeUndefined()
    expect(await sfuSessions.find(anaSession)).toBeNull()
  })
})
