import { Injectable, Logger } from '@nestjs/common'
import type { PeriodWindow, UsageWindow } from '../domain/usage-window'
import {
  type RealtimeEgress,
  type RealtimeEgressSeries,
  RealtimeUsageProvider,
} from '../providers/realtime-usage/realtime-usage.provider'

type Snapshot<T> = { since: Date; until: Date; checkedAt: Date } & T

type Entry = { last: Snapshot<object> | null; failing: boolean; running: Promise<void> | null }

export type CloudflareUsage<T = RealtimeEgress> =
  | { state: 'not-configured' }
  | { state: 'failing'; last: Snapshot<T> | null }
  | { state: 'ready'; last: Snapshot<T> }

// Cloudflare's numbers change by the minute and the analytics API is rate
// limited, so each window is asked at most every few minutes and kept in memory.
const FRESH_MS = 5 * 60 * 1000
// The month, the presets and a few custom ranges.
const MAX_ENTRIES = 16

// SFU and TURN egress as Cloudflare bills it: the month for the SFU budget,
// and the period the admin panel charts.
@Injectable()
export class RealtimeUsageService {
  private readonly logger = new Logger(RealtimeUsageService.name)
  private readonly entries = new Map<string, Entry>()

  constructor(private readonly provider: RealtimeUsageProvider) {}

  // `wait`: the admin panel waits for fresh numbers; checks on the hot path
  // take what is there and refresh in the background.
  current(window: UsageWindow, now: Date, { wait }: { wait: boolean }): Promise<CloudflareUsage> {
    return this.cached(`total:${window.key}`, window, now, wait, () => this.provider.egress(window.since, window.until))
  }

  series(window: PeriodWindow, now: Date): Promise<CloudflareUsage<RealtimeEgressSeries>> {
    return this.cached(`series:${window.key}`, window, now, true, () =>
      this.provider.series(window.since, window.until, window.bucket),
    )
  }

  private async cached<T extends object>(
    key: string,
    window: UsageWindow,
    now: Date,
    wait: boolean,
    load: () => Promise<T>,
  ): Promise<CloudflareUsage<T>> {
    if (!this.provider.configured) return { state: 'not-configured' }
    let entry = this.entries.get(key)
    if (!entry) {
      this.makeRoom()
      entry = { last: null, failing: false, running: null }
      this.entries.set(key, entry)
    }
    const stale = !entry.last || now.getTime() - entry.last.checkedAt.getTime() > FRESH_MS
    if (stale) {
      const refresh = this.refresh(entry, window, now, load)
      if (wait) await refresh
    }
    const last = entry.last as Snapshot<T> | null
    if (entry.failing || !last) return { state: 'failing', last }
    return { state: 'ready', last }
  }

  private refresh(entry: Entry, window: UsageWindow, now: Date, load: () => Promise<object>): Promise<void> {
    entry.running ??= load()
      .then((value) => {
        entry.last = { ...value, since: window.since, until: window.until, checkedAt: now }
        entry.failing = false
      })
      .catch((error: unknown) => {
        entry.failing = true
        this.logger.warn({ err: error }, 'Could not read the SFU and TURN usage from Cloudflare')
      })
      .finally(() => {
        entry.running = null
      })
    return entry.running
  }

  // Custom ranges would pile up otherwise: drop the one checked longest ago.
  private makeRoom(): void {
    if (this.entries.size < MAX_ENTRIES) return
    let oldest: [string, number] | null = null
    for (const [key, entry] of this.entries) {
      const checkedAt = entry.last?.checkedAt.getTime() ?? 0
      if (!entry.running && (!oldest || checkedAt < oldest[1])) oldest = [key, checkedAt]
    }
    if (oldest) this.entries.delete(oldest[0])
  }
}
