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
})
