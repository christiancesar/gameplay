import { RealtimeUsageProvider } from '../providers/realtime-usage/realtime-usage.provider'
import { monthWindow } from '../domain/usage-window'
import { RealtimeUsageService } from './realtime-usage.service'

class StubUsageProvider extends RealtimeUsageProvider {
  configured = true
  failing = false
  calls: string[][] = []
  async egress(since: Date, until: Date) {
    this.calls.push([since.toISOString(), until.toISOString()])
    if (this.failing) throw new Error('down')
    return { sfuBytes: 1000 * this.calls.length, turnBytes: 10 }
  }
  async series(since: Date, until: Date, bucket: string) {
    this.calls.push([since.toISOString(), until.toISOString(), bucket])
    return { sfu: new Map([[since.toISOString(), 500]]), turn: null }
  }
}

const at = (iso: string) => new Date(iso)
const october = (now: Date) => monthWindow('2026-10', now)
const askOctober = (sut: RealtimeUsageService, iso: string, wait = true) =>
  sut.current(october(at(iso)), at(iso), { wait })

describe('RealtimeUsageService', () => {
  it('asks Cloudflare for the month so far, at most every few minutes', async () => {
    const provider = new StubUsageProvider()
    const sut = new RealtimeUsageService(provider)

    const first = await askOctober(sut, '2026-10-27T10:00:00Z')
    expect(first).toMatchObject({ state: 'ready', last: { sfuBytes: 1000, turnBytes: 10 } })
    expect(provider.calls).toEqual([['2026-10-01T00:00:00.000Z', '2026-10-27T10:00:00.000Z']])

    await askOctober(sut, '2026-10-27T10:04:00Z')
    expect(provider.calls).toHaveLength(1)
    const later = await askOctober(sut, '2026-10-27T10:06:00Z')
    expect(later).toMatchObject({ state: 'ready', last: { sfuBytes: 2000 } })
  })

  it('keeps the last numbers and says it is failing when Cloudflare does not answer', async () => {
    const provider = new StubUsageProvider()
    const sut = new RealtimeUsageService(provider)
    await askOctober(sut, '2026-10-27T10:00:00Z')
    provider.failing = true

    const result = await askOctober(sut, '2026-10-27T10:10:00Z')
    expect(result).toMatchObject({ state: 'failing', last: { sfuBytes: 1000 } })
  })

  it('without waiting, answers with what it has and refreshes behind', async () => {
    const provider = new StubUsageProvider()
    const sut = new RealtimeUsageService(provider)

    expect(await askOctober(sut, '2026-10-27T10:00:00Z', false)).toEqual({
      state: 'failing',
      last: null,
    })
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(await askOctober(sut, '2026-10-27T10:00:01Z', false)).toMatchObject({ state: 'ready' })
  })

  it('says when it is not configured', async () => {
    const provider = new StubUsageProvider()
    provider.configured = false
    expect(await new RealtimeUsageService(provider).current(october(new Date()), new Date(), { wait: true })).toEqual({
      state: 'not-configured',
    })
  })

  it('keeps the chart of each period apart from the month', async () => {
    const provider = new StubUsageProvider()
    const sut = new RealtimeUsageService(provider)
    const now = at('2026-10-27T10:00:00Z')
    const day = { key: '24h', since: at('2026-10-26T10:00:00Z'), until: now, bucket: 'fifteen-minutes' as const }

    await askOctober(sut, '2026-10-27T10:00:00Z')
    const chart = await sut.series(day, now)
    await sut.series(day, at('2026-10-27T10:01:00Z'))

    expect(chart).toMatchObject({ state: 'ready', last: { since: day.since, turn: null } })
    expect(provider.calls).toEqual([
      ['2026-10-01T00:00:00.000Z', '2026-10-27T10:00:00.000Z'],
      ['2026-10-26T10:00:00.000Z', '2026-10-27T10:00:00.000Z', 'fifteen-minutes'],
    ])
  })
})
