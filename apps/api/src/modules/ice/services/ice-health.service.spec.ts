import { StunOnlyIceProvider } from '../providers/ice/stun-only/stun-only.ice.provider'
import { CountingIceProvider } from '../test/counting-ice-provider'
import { FALLBACK_STUN_URLS } from '../test/ice-seed'
import { IceHealthService } from './ice-health.service'

describe('IceHealthService', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: new Date('2026-10-26T12:00:00Z'), toFake: ['setTimeout', 'clearTimeout', 'Date'] })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('has nothing to check with STUN only', async () => {
    const health = new IceHealthService(new StunOnlyIceProvider(FALLBACK_STUN_URLS))

    expect(await health.check()).toBeNull()
  })

  it('asks the provider at most once every 5 minutes', async () => {
    const provider = new CountingIceProvider()
    const health = new IceHealthService(provider)

    expect((await health.check())?.status).toBe('operational')
    vi.advanceTimersByTime(4 * 60 * 1000)
    await health.check()
    expect(provider.calls).toBe(1)

    vi.advanceTimersByTime(2 * 60 * 1000)
    await health.check()
    expect(provider.calls).toBe(2)
  })

  it('reports an outage when the provider fails', async () => {
    const provider = new CountingIceProvider()
    provider.failing = true

    expect((await new IceHealthService(provider).check())?.status).toBe('outage')
  })

  it('asks the provider once for callers checking at the same time', async () => {
    const provider = new CountingIceProvider()
    const health = new IceHealthService(provider)

    await Promise.all([health.check(), health.check()])

    expect(provider.calls).toBe(1)
  })
})
