import { USAGE_MAX_DAYS, type RealtimeUsageQuery, type UsageBucket } from '@gameplay/contracts'

// A span of Cloudflare traffic, [since, until). `key` names it for the cache:
// the presets slide with the clock, so they are cached by name.
export type UsageWindow = { key: string; since: Date; until: Date }
// What the usage chart shows: a window cut in buckets.
export type PeriodWindow = UsageWindow & { bucket: UsageBucket }

const MINUTE_MS = 60_000
const HOUR_MS = 60 * MINUTE_MS
const DAY_MS = 24 * HOUR_MS
export const BUCKET_MS: Record<UsageBucket, number> = {
  minute: MINUTE_MS,
  'five-minutes': 5 * MINUTE_MS,
  'fifteen-minutes': 15 * MINUTE_MS,
  hour: HOUR_MS,
  day: DAY_MS,
}
const PRESET_MS = {
  '30m': 30 * MINUTE_MS,
  '6h': 6 * HOUR_MS,
  '12h': 12 * HOUR_MS,
  '24h': DAY_MS,
  '7d': 7 * DAY_MS,
  '30d': 30 * DAY_MS,
} as const

// The month so far (UTC), what the SFU budget counts.
export function monthWindow(month: string, now: Date): UsageWindow {
  return { key: month, since: new Date(`${month}-01T00:00:00Z`), until: now }
}

// The period the admin picked. null when a custom range starts before the
// last USAGE_MAX_DAYS UTC days or after now: Cloudflare has nothing there.
export function usageWindow(query: RealtimeUsageQuery, now: Date): PeriodWindow | null {
  if (query.period !== 'custom') {
    const since = new Date(now.getTime() - PRESET_MS[query.period])
    return { key: query.period, since, until: now, bucket: bucketFor(since, now) }
  }
  const { from = '', to = '' } = query
  const since = new Date(`${from}T00:00:00Z`)
  const dayAfter = new Date(`${to}T00:00:00Z`).getTime() + DAY_MS
  const until = new Date(Math.min(dayAfter, now.getTime()))
  const today = new Date(`${now.toISOString().slice(0, 10)}T00:00:00Z`).getTime()
  if (since.getTime() < today - USAGE_MAX_DAYS * DAY_MS || since >= until) return null
  return { key: `${from}..${to}`, since, until, bucket: bucketFor(since, until) }
}

// Up to about 170 points: minutes for half an hour, days past a week.
function bucketFor(since: Date, until: Date): UsageBucket {
  const span = until.getTime() - since.getTime()
  if (span <= HOUR_MS) return 'minute'
  if (span <= 12 * HOUR_MS) return 'five-minutes'
  if (span <= DAY_MS) return 'fifteen-minutes'
  if (span <= 7 * DAY_MS) return 'hour'
  return 'day'
}
