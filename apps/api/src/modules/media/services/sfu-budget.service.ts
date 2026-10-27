import { Injectable } from '@nestjs/common'
import { REALTIME_FREE_TIER_GB, type RealtimeUsage } from '@gameplay/contracts'
import { MediaSettingsRepository } from '../../limits/repositories/media-settings.repository'
import { BYTES_PER_GB, usageMonth } from '../domain/usage-month'
import { monthWindow } from '../domain/usage-window'
import { MediaUsageRepository } from '../repositories/media-usage.repository'
import { RealtimeUsageService } from './realtime-usage.service'

// The monthly SFU budget: past it, new shares can't use the SFU (the ones
// already on it go on until they end). Cloudflare has no billing cap, so
// this is the only guard. It counts the larger of what viewers report (live)
// and what Cloudflare bills (official, a few minutes late).
@Injectable()
export class SfuBudgetService {
  constructor(
    private readonly usage: MediaUsageRepository,
    private readonly media: MediaSettingsRepository,
    private readonly cloudflare: RealtimeUsageService,
  ) {}

  // For the admin panel: SFU and TURN apart, with Cloudflare's own numbers.
  async current(now = new Date()): Promise<RealtimeUsage> {
    return this.read(now, true)
  }

  async exhausted(now = new Date()): Promise<boolean> {
    const { sfu, budgetGb } = await this.read(now, false)
    return Math.max(sfu.reportedBytes, sfu.cloudflareBytes ?? 0) >= budgetGb * BYTES_PER_GB
  }

  async record(bytes: number, now = new Date()): Promise<void> {
    if (bytes > 0) await this.usage.addSfuBytes(usageMonth(now), bytes)
  }

  private async read(now: Date, wait: boolean): Promise<RealtimeUsage> {
    const month = usageMonth(now)
    const [reportedBytes, budgetGb, cloudflare] = await Promise.all([
      this.usage.sfuBytes(month),
      this.media.getSfuBudgetGb(),
      this.cloudflare.current(monthWindow(month, now), now, { wait }),
    ])
    const last = cloudflare.state === 'not-configured' ? null : cloudflare.last
    return {
      month,
      budgetGb,
      freeTierGb: REALTIME_FREE_TIER_GB,
      sfu: { reportedBytes, cloudflareBytes: last?.sfuBytes ?? null },
      turn: { cloudflareBytes: last?.turnBytes ?? null },
      cloudflare: { state: cloudflare.state, checkedAt: last?.checkedAt.toISOString() ?? null },
    }
  }
}
