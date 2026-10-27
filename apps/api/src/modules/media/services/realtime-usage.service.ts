import { Injectable, Logger } from '@nestjs/common'
import { RealtimeUsageProvider } from '../providers/realtime-usage/realtime-usage.provider'

type Snapshot = {
  month: string
  sfuBytes: number | null
  turnBytes: number | null
  checkedAt: Date
}

export type CloudflareUsage =
  | { state: 'not-configured' }
  | { state: 'failing'; last: Snapshot | null }
  | { state: 'ready'; last: Snapshot }

// Cloudflare's numbers change by the minute and the analytics API is rate
// limited, so they are asked at most every few minutes and kept in memory.
const FRESH_MS = 5 * 60 * 1000

// The month's SFU and TURN egress as Cloudflare bills it.
@Injectable()
export class RealtimeUsageService {
  private readonly logger = new Logger(RealtimeUsageService.name)
  private last: Snapshot | null = null
  private failing = false
  private running: Promise<void> | null = null

  constructor(private readonly provider: RealtimeUsageProvider) {}

  // `wait`: the admin panel waits for fresh numbers; checks on the hot path
  // take what is there and refresh in the background.
  async current(month: string, now: Date, { wait }: { wait: boolean }): Promise<CloudflareUsage> {
    if (!this.provider.configured) return { state: 'not-configured' }
    const stale = !this.last || this.last.month !== month || now.getTime() - this.last.checkedAt.getTime() > FRESH_MS
    if (stale) {
      const refresh = this.refresh(month, now)
      if (wait) await refresh
    }
    const last = this.last?.month === month ? this.last : null
    if (this.failing || !last) return { state: 'failing', last }
    return { state: 'ready', last }
  }

  private refresh(month: string, now: Date): Promise<void> {
    this.running ??= this.provider
      .egress(`${month}-01`, now.toISOString().slice(0, 10))
      .then(({ sfuBytes, turnBytes }) => {
        this.last = { month, sfuBytes, turnBytes, checkedAt: now }
        this.failing = false
      })
      .catch((error: unknown) => {
        this.failing = true
        this.logger.warn({ err: error }, 'Could not read the SFU and TURN usage from Cloudflare')
      })
      .finally(() => {
        this.running = null
      })
    return this.running
  }
}
