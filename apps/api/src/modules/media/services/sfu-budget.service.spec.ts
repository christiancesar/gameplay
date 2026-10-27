import { InMemoryMediaSettingsRepository } from '../../limits/repositories/in-memory/in-memory-media-settings.repository'
import { RealtimeUsageProvider } from '../providers/realtime-usage/realtime-usage.provider'
import { InMemoryMediaUsageRepository } from '../repositories/in-memory/in-memory-media-usage.repository'
import { RealtimeUsageService } from './realtime-usage.service'
import { SfuBudgetService } from './sfu-budget.service'

class FixedUsageProvider extends RealtimeUsageProvider {
  readonly configured = true
  constructor(private readonly sfuBytes: number) {
    super()
  }
  async egress() {
    return { sfuBytes: this.sfuBytes, turnBytes: 400 }
  }
}

const now = new Date('2026-10-27T10:00:00Z')

describe('SfuBudgetService', () => {
  it("shows SFU and TURN apart, with Cloudflare's numbers and the free tier", async () => {
    const usage = new InMemoryMediaUsageRepository()
    await usage.addSfuBytes('2026-10', 300)
    const sut = new SfuBudgetService(
      usage,
      new InMemoryMediaSettingsRepository(),
      new RealtimeUsageService(new FixedUsageProvider(900)),
    )

    expect(await sut.current(now)).toEqual({
      month: '2026-10',
      budgetGb: 800,
      freeTierGb: 1000,
      sfu: { reportedBytes: 300, cloudflareBytes: 900 },
      turn: { cloudflareBytes: 400 },
      cloudflare: { state: 'ready', checkedAt: now.toISOString() },
    })
  })

  it("counts the larger of the viewers' reports and Cloudflare's number", async () => {
    const media = new InMemoryMediaSettingsRepository()
    await media.setSfuBudgetGb(1)
    const sut = new SfuBudgetService(
      new InMemoryMediaUsageRepository(),
      media,
      new RealtimeUsageService(new FixedUsageProvider(1_000_000_000)),
    )

    await sut.current(now)
    expect(await sut.exhausted(now)).toBe(true)
  })
})
