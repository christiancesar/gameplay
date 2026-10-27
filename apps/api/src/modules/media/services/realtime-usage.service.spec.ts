import { RealtimeUsageProvider } from '../providers/realtime-usage/realtime-usage.provider'
import { RealtimeUsageService } from './realtime-usage.service'

class StubUsageProvider extends RealtimeUsageProvider {
  configured = true
  failing = false
  calls: [string, string][] = []
  async egress(from: string, to: string) {
    this.calls.push([from, to])
    if (this.failing) throw new Error('down')
    return { sfuBytes: 1000 * this.calls.length, turnBytes: 10 }
  }
}

const at = (iso: string) => new Date(iso)

describe('RealtimeUsageService', () => {
  it('asks Cloudflare for the month so far, at most every few minutes', async () => {
    const provider = new StubUsageProvider()
    const sut = new RealtimeUsageService(provider)

    const first = await sut.current('2026-10', at('2026-10-27T10:00:00Z'), { wait: true })
    expect(first).toMatchObject({ state: 'ready', last: { sfuBytes: 1000, turnBytes: 10 } })
    expect(provider.calls).toEqual([['2026-10-01', '2026-10-27']])

    await sut.current('2026-10', at('2026-10-27T10:04:00Z'), { wait: true })
    expect(provider.calls).toHaveLength(1)
    const later = await sut.current('2026-10', at('2026-10-27T10:06:00Z'), { wait: true })
    expect(later).toMatchObject({ state: 'ready', last: { sfuBytes: 2000 } })
  })

  it('keeps the last numbers and says it is failing when Cloudflare does not answer', async () => {
    const provider = new StubUsageProvider()
    const sut = new RealtimeUsageService(provider)
    await sut.current('2026-10', at('2026-10-27T10:00:00Z'), { wait: true })
    provider.failing = true

    const result = await sut.current('2026-10', at('2026-10-27T10:10:00Z'), { wait: true })
    expect(result).toMatchObject({ state: 'failing', last: { sfuBytes: 1000 } })
  })

  it('without waiting, answers with what it has and refreshes behind', async () => {
    const provider = new StubUsageProvider()
    const sut = new RealtimeUsageService(provider)

    expect(await sut.current('2026-10', at('2026-10-27T10:00:00Z'), { wait: false })).toEqual({
      state: 'failing',
      last: null,
    })
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(await sut.current('2026-10', at('2026-10-27T10:00:01Z'), { wait: false })).toMatchObject({ state: 'ready' })
  })

  it('says when it is not configured', async () => {
    const provider = new StubUsageProvider()
    provider.configured = false
    expect(await new RealtimeUsageService(provider).current('2026-10', new Date(), { wait: true })).toEqual({
      state: 'not-configured',
    })
  })
})
