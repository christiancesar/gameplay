import { Logger } from '@nestjs/common'
import { makeIceContext } from '../test/ice-context'
import { FALLBACK_STUN_URLS } from '../test/ice-seed'

describe('GetIceConfigUseCase', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: new Date('2026-10-24T12:00:00Z') })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('reuses the credentials while more than half of the TTL is left', async () => {
    const { getIceConfig, provider } = makeIceContext()
    await getIceConfig.execute('u1')

    vi.advanceTimersByTime(20 * 60 * 1000)
    const again = await getIceConfig.execute('u1')

    expect(provider.calls).toBe(1)
    expect(again.ttlSeconds).toBe(40 * 60)
  })

  it('issues new credentials past half of the TTL', async () => {
    const { getIceConfig, provider } = makeIceContext()
    await getIceConfig.execute('u1')

    vi.advanceTimersByTime(31 * 60 * 1000)
    const again = await getIceConfig.execute('u1')

    expect(provider.calls).toBe(2)
    expect(again.ttlSeconds).toBe(3600)
  })

  it('keeps users apart', async () => {
    const { getIceConfig, provider } = makeIceContext()

    await getIceConfig.execute('u1')
    const other = await getIceConfig.execute('u2')

    expect(provider.calls).toBe(2)
    expect(other.iceServers[0].username).toBe('u2-2')
  })

  it('answers with STUN only for a minute when the provider fails', async () => {
    const { getIceConfig, provider } = makeIceContext()
    provider.failing = true
    const warn = vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => {})

    const issued = await getIceConfig.execute('u1')

    expect(issued).toEqual({ iceServers: [{ urls: FALLBACK_STUN_URLS }], ttlSeconds: 60 })
    expect(warn).toHaveBeenCalledOnce()
    warn.mockRestore()
  })

  describe('TURN turned off by the platform admin', () => {
    it('hands out STUN only where TURN is off', async () => {
      const { getIceConfig, provider, mediaSettings } = makeIceContext()
      mediaSettings.addServer('s1')
      await mediaSettings.setServer('s1', { sfu: null, mesh: null, turn: false })

      expect(await getIceConfig.execute('u1', 's1')).toEqual({
        iceServers: [{ urls: FALLBACK_STUN_URLS }],
        ttlSeconds: 0,
      })
      expect((await getIceConfig.execute('u1', 'other')).ttlSeconds).toBe(3600)

      await mediaSettings.setGlobal({ sfu: true, mesh: true, turn: false })
      expect((await getIceConfig.execute('u2')).ttlSeconds).toBe(0)
      expect(provider.calls).toBe(1)
    })

    it('revokes the credentials of the people it cut', async () => {
      const { getIceConfig, provider, listener } = makeIceContext()
      const issued = await getIceConfig.execute('u1')
      await getIceConfig.execute('u2')

      await listener.mediaChanged({ serverId: null, disabled: ['mesh'], turnCutUserIds: ['u1'] })
      expect(provider.revoked).toEqual([])

      await listener.mediaChanged({ serverId: null, disabled: ['turn'], turnCutUserIds: ['u1', 'nobody'] })
      expect(provider.revoked).toEqual([issued])
      // The next request issues new credentials.
      await getIceConfig.execute('u1')
      expect(provider.calls).toBe(3)
    })
  })
})
