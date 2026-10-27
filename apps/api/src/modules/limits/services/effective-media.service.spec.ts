import { makeLimitsContext } from '../test/limits-context'

describe('EffectiveMediaService', () => {
  it('follows the global setting unless the server overrides it, both ways', async () => {
    const { mediaSettings, effectiveMedia } = makeLimitsContext()
    mediaSettings.addServer('s1')
    await mediaSettings.setGlobal({ sfu: false, mesh: true, turn: true })
    await mediaSettings.setServer('s1', { sfu: true, mesh: false, turn: null })

    expect(await effectiveMedia.forServer('s1')).toEqual({ sfu: true, mesh: false, turn: true })
    expect(await effectiveMedia.forServer('other')).toEqual({ sfu: false, mesh: true, turn: true })
    expect(await effectiveMedia.isOn('s1', 'mesh')).toBe(false)
  })
})
