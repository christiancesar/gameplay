import type { UsageBucket } from '@gameplay/contracts'
import { BUCKET_MS } from './usage-window'

// Bytes per bucket start (ISO). Cloudflare leaves out the buckets with no traffic.
export type EgressSeries = Map<string, number>

export type UsagePoint = { at: string; sfuBytes: number | null; turnBytes: number | null }

// One point per bucket from the one holding `since` to the one holding
// `until`, zero where Cloudflare had no row. A null series stays null.
export function fillUsagePoints(
  since: Date,
  until: Date,
  bucket: UsageBucket,
  sfu: EgressSeries | null,
  turn: EgressSeries | null,
): UsagePoint[] {
  const step = BUCKET_MS[bucket]
  const points: UsagePoint[] = []
  for (let at = Math.floor(since.getTime() / step) * step; at < until.getTime(); at += step) {
    const key = new Date(at).toISOString()
    points.push({ at: key, sfuBytes: sfu ? (sfu.get(key) ?? 0) : null, turnBytes: turn ? (turn.get(key) ?? 0) : null })
  }
  return points
}
