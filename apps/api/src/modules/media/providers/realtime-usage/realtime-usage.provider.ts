import type { UsageBucket } from '@gameplay/contracts'
import type { EgressSeries } from '../../domain/usage-series'

// Egress billed by Cloudflare in [since, until). null when there is nothing to
// measure (no SFU app or no Cloudflare TURN key).
export type RealtimeEgress = { sfuBytes: number | null; turnBytes: number | null }
export type RealtimeEgressSeries = { sfu: EgressSeries | null; turn: EgressSeries | null }

// Where the official SFU and TURN usage comes from.
export abstract class RealtimeUsageProvider {
  abstract readonly configured: boolean
  abstract egress(since: Date, until: Date): Promise<RealtimeEgress>
  // The same, per bucket.
  abstract series(since: Date, until: Date, bucket: UsageBucket): Promise<RealtimeEgressSeries>
}
