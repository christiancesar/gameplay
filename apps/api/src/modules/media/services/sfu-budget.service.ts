import { Injectable } from '@nestjs/common'
import type { SfuUsage } from '@gameplay/contracts'
import { MediaSettingsRepository } from '../../limits/repositories/media-settings.repository'
import { BYTES_PER_GB, usageMonth } from '../domain/usage-month'
import { MediaUsageRepository } from '../repositories/media-usage.repository'

// The monthly SFU budget: past it, new shares can't use the SFU (the ones
// already on it go on until they end). Cloudflare has no billing cap, so
// this is the only guard.
@Injectable()
export class SfuBudgetService {
  constructor(
    private readonly usage: MediaUsageRepository,
    private readonly media: MediaSettingsRepository,
  ) {}

  async current(now = new Date()): Promise<SfuUsage> {
    const month = usageMonth(now)
    const [usedBytes, budgetGb] = await Promise.all([this.usage.sfuBytes(month), this.media.getSfuBudgetGb()])
    return { month, usedBytes, budgetGb }
  }

  async exhausted(now = new Date()): Promise<boolean> {
    const { usedBytes, budgetGb } = await this.current(now)
    return usedBytes >= budgetGb * BYTES_PER_GB
  }

  async record(bytes: number, now = new Date()): Promise<void> {
    if (bytes > 0) await this.usage.addSfuBytes(usageMonth(now), bytes)
  }
}
