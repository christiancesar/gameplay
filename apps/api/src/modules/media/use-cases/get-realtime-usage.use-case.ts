import { Injectable } from '@nestjs/common'
import type { RealtimeUsagePeriod, RealtimeUsageQuery } from '@gameplay/contracts'
import { type EgressSeries, fillUsagePoints } from '../domain/usage-series'
import { usageWindow } from '../domain/usage-window'
import { UsagePeriodOutOfRangeError } from '../errors/media.errors'
import { RealtimeUsageService } from '../services/realtime-usage.service'

const sum = (series: EgressSeries | null) => (series ? [...series.values()].reduce((a, b) => a + b, 0) : null)

// The Media tab's usage chart: SFU and TURN egress Cloudflare billed in the
// period the admin picked, per bucket and in total.
@Injectable()
export class GetRealtimeUsageUseCase {
  constructor(private readonly cloudflare: RealtimeUsageService) {}

  async execute(query: RealtimeUsageQuery, now = new Date()): Promise<RealtimeUsagePeriod> {
    const window = usageWindow(query, now)
    if (!window) throw new UsagePeriodOutOfRangeError()
    const usage = await this.cloudflare.series(window, now)
    const last = usage.state === 'not-configured' ? null : usage.last
    const since = last?.since ?? window.since
    const until = last?.until ?? window.until
    return {
      from: since.toISOString(),
      to: until.toISOString(),
      bucket: window.bucket,
      sfu: { cloudflareBytes: sum(last?.sfu ?? null) },
      turn: { cloudflareBytes: sum(last?.turn ?? null) },
      points: last ? fillUsagePoints(since, until, window.bucket, last.sfu, last.turn) : [],
      cloudflare: { state: usage.state, checkedAt: last?.checkedAt.toISOString() ?? null },
    }
  }
}
