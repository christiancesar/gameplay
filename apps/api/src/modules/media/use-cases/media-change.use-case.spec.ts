import { ServerNotFoundError } from '../../servers/errors/servers.errors'
import { SfuDisabledError } from '../errors/media.errors'
import { makeMediaContext } from '../test/media-context'

const ALL_ON = { sfu: true, mesh: true, turn: true }
const FOLLOW = { sfu: null, mesh: null, turn: null }
const notice = { title: 'Media down', message: 'Back soon.' }

// Ana shares through mesh in r1 with Bia; Caio is in r2. All in s1.
async function sharing() {
  const ctx = makeMediaContext()
  await ctx.join('ana', 'r1')
  await ctx.join('bia', 'r1')
  await ctx.join('caio', 'r2')
  await ctx.updateVoiceState.execute({ userId: 'ana', socketId: 'ana-tab', streaming: '720p30', streamMode: 'mesh' })
  ctx.events.published.length = 0
  return ctx
}

describe('media changes', () => {
  it('turning mesh off globally reaches the room with a mesh share', async () => {
    const { updateMediaSettings, events } = await sharing()

    const result = await updateMediaSettings.execute({ settings: { ...ALL_ON, mesh: false }, sentById: 'admin' })

    expect(result).toEqual({ notified: 0 })
    expect(events.published).toEqual([
      { name: 'media.changed', payload: { serverId: null, disabled: ['mesh'], turnCutUserIds: [] } },
    ])
  })

  it('tells only the people it cut off, when asked', async () => {
    const { updateMediaSettings, notifications } = await sharing()

    const result = await updateMediaSettings.execute({
      settings: { ...ALL_ON, mesh: false },
      notice: { ...notice, audience: 'affected' },
      sentById: 'admin',
    })

    expect(result).toEqual({ notified: 2 })
    expect(notifications.notifications.map((n) => n.userId)).toEqual(['ana', 'bia'])
  })

  it('turning TURN off for a server cuts everyone in its rooms and can tell its members', async () => {
    const { updateServerMedia, events, notifications, servers } = await sharing()
    servers.addMember('s1', 'ana', 'owner')

    const result = await updateServerMedia.execute({
      serverId: 's1',
      overrides: { ...FOLLOW, turn: false },
      notice: { ...notice, audience: 'members' },
      sentById: 'admin',
    })

    expect(events.published[0]).toEqual({
      name: 'media.changed',
      payload: { serverId: 's1', disabled: ['turn'], turnCutUserIds: ['ana', 'bia', 'caio'] },
    })
    expect(result.notified).toBe(notifications.notifications.length)
    await expect(
      updateServerMedia.execute({ serverId: 'gone', overrides: FOLLOW, sentById: 'admin' }),
    ).rejects.toBeInstanceOf(ServerNotFoundError)
  })

  it('a server can keep what the platform turned off', async () => {
    const { updateServerMedia, updateMediaSettings, events } = await sharing()
    await updateServerMedia.execute({ serverId: 's1', overrides: { ...FOLLOW, mesh: true }, sentById: 'admin' })
    events.published.length = 0

    await updateMediaSettings.execute({ settings: { ...ALL_ON, mesh: false }, sentById: 'admin' })

    expect(events.published[0].payload).toMatchObject({ disabled: ['mesh'] })
  })

  it('counts who each resource would cut off now', async () => {
    const { impact } = await sharing()

    expect(await impact.execute(null)).toEqual({ sfu: 0, mesh: 2, turn: 3 })
    expect(await impact.execute('s1')).toEqual({ sfu: 0, mesh: 2, turn: 3 })
    await expect(impact.execute('gone')).rejects.toBeInstanceOf(ServerNotFoundError)
  })

  it('tells members what the server offers', async () => {
    const { serverMedia, servers, mediaSettings, provider } = makeMediaContext()
    servers.addMember('s1', 'ana', 'owner')

    expect(await serverMedia.execute({ userId: 'ana', serverId: 's1' })).toEqual({
      sfu: { available: true, reason: null },
      mesh: { available: true },
      turn: { available: true },
    })
    await mediaSettings.setServer('s1', { sfu: false, mesh: null, turn: false })
    expect(await serverMedia.execute({ userId: 'ana', serverId: 's1' })).toMatchObject({
      sfu: { available: false, reason: 'disabled' },
      turn: { available: false },
    })
    await mediaSettings.setServer('s1', FOLLOW)
    provider.configured = false
    expect((await serverMedia.execute({ userId: 'ana', serverId: 's1' })).sfu.reason).toBe('not-configured')
    await expect(serverMedia.execute({ userId: 'nobody', serverId: 's1' })).rejects.toBeInstanceOf(ServerNotFoundError)
  })

  it('refuses SFU sessions where the SFU is off', async () => {
    const { join, createSession, mediaSettings } = makeMediaContext()
    await join('ana', 'r1')
    await mediaSettings.setServer('s1', { ...FOLLOW, sfu: false })

    await expect(createSession.execute({ userId: 'ana' })).rejects.toBeInstanceOf(SfuDisabledError)
  })
})
